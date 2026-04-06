#!/usr/bin/env bash
# ============================================
# デプロイスクリプト
# ============================================
#
# 使い方:
#   ENVIRONMENT=staging ./scripts/deploy.sh
#   ENVIRONMENT=production ./scripts/deploy.sh
#
# Why シェルスクリプト:
# - CI/CD パイプラインの外でも手動デプロイが可能
# - 環境変数で staging/production を切り替え（同一スクリプト）
# - ロールバックも同じスクリプトで実行可能

set -euo pipefail

# ---- 設定 ----

ENVIRONMENT="${ENVIRONMENT:?ENVIRONMENT is required (staging or production)}"
PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
REGION="${GCP_REGION:-asia-northeast1}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD)}"

# 環境別設定
case "${ENVIRONMENT}" in
  staging)
    SERVICE_NAME="app-staging"
    MEMORY="512Mi"
    CPU="1"
    MIN_INSTANCES="0"
    MAX_INSTANCES="5"
    ALLOW_UNAUTHENTICATED="--allow-unauthenticated"
    ;;
  production)
    SERVICE_NAME="app-production"
    MEMORY="1Gi"
    CPU="2"
    MIN_INSTANCES="1"
    MAX_INSTANCES="20"
    ALLOW_UNAUTHENTICATED="--no-allow-unauthenticated"
    ;;
  *)
    echo "ERROR: ENVIRONMENT must be 'staging' or 'production' (got: ${ENVIRONMENT})"
    exit 1
    ;;
esac

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run/${SERVICE_NAME}:${IMAGE_TAG}"

# ---- 関数 ----

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

confirm() {
  if [ "${ENVIRONMENT}" = "production" ]; then
    echo ""
    echo "========================================="
    echo "  WARNING: Production deployment"
    echo "  Image: ${IMAGE}"
    echo "========================================="
    echo ""
    read -rp "Are you sure? (yes/no): " answer
    if [ "${answer}" != "yes" ]; then
      log "Deployment cancelled."
      exit 0
    fi
  fi
}

build_image() {
  log "Building Docker image: ${IMAGE}"
  docker build \
    --build-arg NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-}" \
    -t "${IMAGE}" \
    .
}

push_image() {
  log "Pushing image to Artifact Registry..."
  gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
  docker push "${IMAGE}"
}

deploy() {
  log "Deploying to Cloud Run (${ENVIRONMENT})..."
  # shellcheck disable=SC2086
  gcloud run deploy "${SERVICE_NAME}" \
    --image="${IMAGE}" \
    --region="${REGION}" \
    --platform=managed \
    ${ALLOW_UNAUTHENTICATED} \
    --set-env-vars="ENVIRONMENT=${ENVIRONMENT}" \
    --memory="${MEMORY}" \
    --cpu="${CPU}" \
    --min-instances="${MIN_INSTANCES}" \
    --max-instances="${MAX_INSTANCES}" \
    --quiet
}

health_check() {
  local url
  url=$(gcloud run services describe "${SERVICE_NAME}" \
    --region="${REGION}" \
    --format="value(status.url)")

  log "Running health check: ${url}/health"
  for i in 1 2 3 4 5; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "${url}/health" || echo "000")
    if [ "${status}" = "200" ]; then
      log "Health check passed (attempt ${i})"
      return 0
    fi
    log "Health check attempt ${i} failed (HTTP ${status}), retrying..."
    sleep 5
  done

  log "ERROR: Health check failed after 5 attempts"
  return 1
}

rollback() {
  local previous_tag="${1:?Usage: rollback <previous-image-tag>}"
  local previous_image="${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run/${SERVICE_NAME}:${previous_tag}"

  log "Rolling back to: ${previous_image}"
  gcloud run deploy "${SERVICE_NAME}" \
    --image="${previous_image}" \
    --region="${REGION}" \
    --platform=managed \
    --quiet
}

# ---- メイン処理 ----

main() {
  log "Starting deployment: ${ENVIRONMENT}"
  log "  Service: ${SERVICE_NAME}"
  log "  Image:   ${IMAGE}"
  log "  Region:  ${REGION}"

  confirm
  build_image
  push_image
  deploy

  if health_check; then
    log "Deployment successful!"
  else
    log "ERROR: Deployment may have failed. Check Cloud Run console."
    exit 1
  fi
}

# スクリプトが直接実行された場合のみ main を呼ぶ
# source された場合は関数のみ定義（テスト用）
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
