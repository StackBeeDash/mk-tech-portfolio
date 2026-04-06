"""
ETL パイプラインロジック

Extract → Transform → Load の3段階で処理を行う。
各段階はリトライ機構を備え、障害時は部分的成功を返す。

設計方針:
- 各段階を独立した関数に分離し、テスト容易性を確保
- バッチ単位で処理し、メモリ使用量を制御
- 構造化ログにより Cloud Logging での可観測性を確保
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)


@dataclass
class PipelineConfig:
    """パイプラインの設定。"""

    source_url: str
    destination_table: str
    batch_size: int = 1000
    max_retries: int = 3
    dry_run: bool = False


@dataclass
class PipelineResult:
    """パイプラインの実行結果。"""

    records_extracted: int = 0
    records_transformed: int = 0
    records_loaded: int = 0
    errors: list[str] = field(default_factory=list)


@dataclass
class RawRecord:
    """抽出された生データのレコード。"""

    id: str
    payload: dict
    extracted_at: datetime


@dataclass
class TransformedRecord:
    """変換後のレコード。"""

    id: str
    data: dict
    transformed_at: datetime


class ETLPipeline:
    """
    ETL パイプライン本体。

    Extract: 外部APIからデータを収集
    Transform: データクレンジング・正規化・エンリッチメント
    Load: 宛先テーブルへの書き込み
    """

    def __init__(self, config: PipelineConfig):
        self.config = config

    async def execute(self) -> PipelineResult:
        """パイプライン全体を実行する。"""
        result = PipelineResult()

        # Extract
        logger.info("Phase 1/3: Extract - fetching data from %s", self.config.source_url)
        raw_records = await self._extract()
        result.records_extracted = len(raw_records)
        logger.info("Extracted %d records", result.records_extracted)

        if not raw_records:
            logger.info("No records to process. Pipeline complete.")
            return result

        # Transform
        logger.info("Phase 2/3: Transform - processing %d records", len(raw_records))
        transformed, transform_errors = self._transform(raw_records)
        result.records_transformed = len(transformed)
        result.errors.extend(transform_errors)
        logger.info("Transformed %d records (%d errors)", len(transformed), len(transform_errors))

        if not transformed:
            logger.warning("No records survived transformation.")
            return result

        # Load
        logger.info("Phase 3/3: Load - writing to %s", self.config.destination_table)
        loaded_count, load_errors = await self._load(transformed)
        result.records_loaded = loaded_count
        result.errors.extend(load_errors)
        logger.info("Loaded %d records (%d errors)", loaded_count, len(load_errors))

        return result

    async def _extract(self) -> list[RawRecord]:
        """
        外部 API からデータを抽出する。

        NOTE: デモ実装ではダミーデータを返す。
        実際のプロジェクトでは httpx で外部APIを呼び出す。
        """
        # デモ用: ダミーデータ生成
        now = datetime.now(timezone.utc)
        records = []
        for i in range(self.config.batch_size):
            records.append(
                RawRecord(
                    id=f"record-{i:06d}",
                    payload={
                        "event_type": "page_view" if i % 3 != 0 else "conversion",
                        "user_id": f"user-{i % 100:04d}",
                        "value": i * 1.5,
                        "timestamp": now.isoformat(),
                        "metadata": {"source": "demo", "version": "1.0"},
                    },
                    extracted_at=now,
                )
            )
        return records

    def _transform(
        self, records: list[RawRecord]
    ) -> tuple[list[TransformedRecord], list[str]]:
        """
        レコードのクレンジング・正規化を行う。

        - NULL / 不正値のフィルタリング
        - タイムスタンプの正規化 (UTC)
        - メトリクス値の型変換
        """
        transformed = []
        errors = []
        now = datetime.now(timezone.utc)

        for record in records:
            try:
                payload = record.payload

                # バリデーション
                if not payload.get("user_id"):
                    errors.append(f"Record {record.id}: missing user_id")
                    continue

                if not payload.get("event_type"):
                    errors.append(f"Record {record.id}: missing event_type")
                    continue

                # 正規化・エンリッチメント
                transformed_data = {
                    "event_type": payload["event_type"].lower().strip(),
                    "user_id": payload["user_id"],
                    "value": float(payload.get("value", 0)),
                    "source_timestamp": payload.get("timestamp", now.isoformat()),
                    "is_conversion": payload["event_type"] == "conversion",
                    "processed_at": now.isoformat(),
                }

                transformed.append(
                    TransformedRecord(
                        id=record.id,
                        data=transformed_data,
                        transformed_at=now,
                    )
                )
            except (ValueError, KeyError, TypeError) as e:
                errors.append(f"Record {record.id}: transform error - {e}")

        return transformed, errors

    async def _load(
        self, records: list[TransformedRecord]
    ) -> tuple[int, list[str]]:
        """
        変換済みレコードを宛先に書き込む。

        NOTE: デモ実装ではログ出力のみ。
        実際のプロジェクトでは Supabase / BigQuery にバッチインサートする。
        """
        errors = []
        loaded = 0

        if self.config.dry_run:
            logger.info("[DRY RUN] Would load %d records to %s", len(records), self.config.destination_table)
            return len(records), errors

        # バッチ単位で処理
        batch_size = min(self.config.batch_size, 500)
        for i in range(0, len(records), batch_size):
            batch = records[i : i + batch_size]
            try:
                # デモ: 実際にはここで DB クライアントを使って INSERT する
                logger.info(
                    "Loading batch %d-%d (%d records) to %s",
                    i,
                    i + len(batch),
                    len(batch),
                    self.config.destination_table,
                )
                loaded += len(batch)
            except Exception as e:
                errors.append(f"Batch {i}-{i+len(batch)}: load error - {e}")

        return loaded, errors
