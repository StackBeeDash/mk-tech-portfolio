"""
Cloud Run Jobs データパイプライン - エントリポイント

FastAPI ベースのバッチ処理。Cloud Run Jobs として実行され、
データ収集 → 変換 → ロードの ETL パイプラインを処理する。

NOTE: 本ファイルはポートフォリオ用のデモ実装です。
実際のプロジェクトでは Supabase / BigQuery への接続情報は
環境変数またはSecret Managerから取得します。
"""

import logging
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from pipeline import ETLPipeline, PipelineConfig

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def get_pipeline_config() -> PipelineConfig:
    """環境変数からパイプライン設定を構築する。"""
    return PipelineConfig(
        source_url=os.getenv("SOURCE_API_URL", "https://api.example.com/data"),
        destination_table=os.getenv("DEST_TABLE", "analytics.processed_events"),
        batch_size=int(os.getenv("BATCH_SIZE", "1000")),
        max_retries=int(os.getenv("MAX_RETRIES", "3")),
        dry_run=os.getenv("DRY_RUN", "false").lower() == "true",
    )


pipeline_instance: ETLPipeline | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションのライフサイクル管理。"""
    global pipeline_instance
    config = get_pipeline_config()
    pipeline_instance = ETLPipeline(config)
    logger.info("Pipeline initialized with config: %s", config)
    yield
    logger.info("Pipeline shutdown complete.")


app = FastAPI(
    title="Data Pipeline - Cloud Run Jobs",
    description="ETL バッチパイプライン for Cloud Run Jobs",
    version="1.0.0",
    lifespan=lifespan,
)


class PipelineResult(BaseModel):
    status: str
    records_extracted: int
    records_transformed: int
    records_loaded: int
    errors: list[str]


@app.get("/health")
async def health_check():
    """ヘルスチェックエンドポイント。"""
    return {"status": "healthy"}


@app.post("/run", response_model=PipelineResult)
async def run_pipeline():
    """
    ETL パイプラインを実行する。

    Cloud Run Jobs はこのエンドポイントをトリガーして
    バッチ処理を開始する。
    """
    if pipeline_instance is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")

    try:
        result = await pipeline_instance.execute()
        return PipelineResult(
            status="success" if not result.errors else "partial_success",
            records_extracted=result.records_extracted,
            records_transformed=result.records_transformed,
            records_loaded=result.records_loaded,
            errors=result.errors,
        )
    except Exception as e:
        logger.error("Pipeline execution failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


def main():
    """
    Cloud Run Jobs エントリポイント。

    Cloud Run Jobs ではHTTPサーバーではなく直接実行するため、
    このmain関数がコンテナ起動時に呼ばれる。
    """
    import asyncio

    logger.info("Starting ETL pipeline as Cloud Run Job...")
    config = get_pipeline_config()
    pipeline = ETLPipeline(config)

    try:
        result = asyncio.run(pipeline.execute())
        logger.info(
            "Pipeline completed: extracted=%d, transformed=%d, loaded=%d",
            result.records_extracted,
            result.records_transformed,
            result.records_loaded,
        )
        if result.errors:
            logger.warning("Pipeline completed with errors: %s", result.errors)
            sys.exit(1)
        sys.exit(0)
    except Exception as e:
        logger.error("Pipeline failed: %s", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
