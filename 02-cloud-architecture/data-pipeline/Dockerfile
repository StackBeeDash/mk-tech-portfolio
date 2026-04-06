# ============================================
# Cloud Run Jobs 用マルチステージビルド
# ============================================
# Stage 1: 依存関係のインストール
# Stage 2: 軽量ランタイムイメージ
#
# Why マルチステージ:
# - ビルド時の依存（pip, gcc等）をランタイムに持ち込まない
# - イメージサイズ削減 → Cloud Run のコールドスタート改善
# - セキュリティ面でも攻撃対象が減る

# ---- Stage 1: Builder ----
FROM python:3.12-slim AS builder

WORKDIR /build

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ---- Stage 2: Runtime ----
FROM python:3.12-slim AS runtime

# セキュリティ: non-root ユーザーで実行
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Builder からインストール済みパッケージをコピー
COPY --from=builder /install /usr/local

# アプリケーションコードをコピー
COPY src/ ./

# non-root ユーザーに切り替え
USER appuser

# Cloud Run Jobs はポートリッスン不要だが、
# デバッグ用に FastAPI サーバーも起動可能にしておく
ENV PORT=8080
EXPOSE 8080

# Cloud Run Jobs のエントリポイント
# ジョブ実行時は main.py を直接実行
CMD ["python", "main.py"]
