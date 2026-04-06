# ============================================
# マルチステージビルド: Node.js アプリケーション
# ============================================
#
# Why マルチステージ:
# - ビルド時の devDependencies をランタイムに持ち込まない
# - イメージサイズ: ~800MB → ~150MB
# - セキュリティ: gcc, make 等のビルドツールがランタイムに存在しない
#
# ステージ構成:
# 1. deps: 依存関係のインストール
# 2. builder: アプリケーションのビルド
# 3. runner: 最小ランタイム

# ---- Stage 1: Dependencies ----
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# パッケージマネージャーのロックファイルを先にコピー（キャッシュ効率化）
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Stage 2: Builder ----
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ビルド時の環境変数
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN pnpm run build

# ---- Stage 3: Runner ----
FROM node:20-alpine AS runner

# セキュリティ: non-root ユーザーで実行
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

WORKDIR /app

# 本番用の依存関係のみコピー
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

# Next.js のスタンドアロン出力を使用する場合
# COPY --from=builder /app/.next/standalone ./
# COPY --from=builder /app/.next/static ./.next/static

USER appuser

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

CMD ["node_modules/.bin/next", "start", "-p", "8080"]
