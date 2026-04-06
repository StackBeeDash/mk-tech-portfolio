"""JMeter CSV 結果ファイルを分析し、Markdown レポートを生成するスクリプト.

使用方法:
    python analyze-results.py results.csv --output report.md
    python analyze-results.py results.csv --p95-threshold 500 --error-threshold 1.0
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd


@dataclass
class SLACriteria:
    """SLA 判定基準."""

    p95_threshold_ms: float = 500.0
    p99_threshold_ms: float = 1000.0
    error_threshold_pct: float = 1.0


@dataclass
class EndpointMetrics:
    """エンドポイントごとのメトリクス."""

    label: str
    count: int
    error_count: int
    error_rate_pct: float
    mean_ms: float
    median_ms: float
    p90_ms: float
    p95_ms: float
    p99_ms: float
    min_ms: float
    max_ms: float
    throughput_rps: float


def load_jmeter_csv(filepath: str) -> pd.DataFrame:
    """JMeter CSV 結果ファイルを読み込む.

    JMeter の CSV 出力フォーマット:
    timeStamp, elapsed, label, responseCode, responseMessage,
    threadName, dataType, success, failureMessage, bytes,
    sentBytes, grpThreads, allThreads, URL, Latency, IdleTime, Connect

    Args:
        filepath: CSV ファイルのパス

    Returns:
        pandas DataFrame

    Raises:
        FileNotFoundError: ファイルが見つからない場合
        ValueError: CSV フォーマットが不正な場合
    """
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"結果ファイルが見つかりません: {filepath}")

    df = pd.read_csv(filepath)

    required_columns = {"elapsed", "label", "success"}
    if not required_columns.issubset(df.columns):
        missing = required_columns - set(df.columns)
        raise ValueError(f"必要なカラムがありません: {missing}")

    return df


def calculate_metrics(df: pd.DataFrame) -> list[EndpointMetrics]:
    """エンドポイントごとのメトリクスを計算する.

    Args:
        df: JMeter CSV を読み込んだ DataFrame

    Returns:
        エンドポイントごとのメトリクスリスト
    """
    metrics_list: list[EndpointMetrics] = []

    # テスト全体の期間を計算（スループット算出用）
    if "timeStamp" in df.columns:
        total_duration_s = (df["timeStamp"].max() - df["timeStamp"].min()) / 1000.0
    else:
        total_duration_s = df["elapsed"].sum() / 1000.0

    total_duration_s = max(total_duration_s, 1.0)  # ゼロ除算防止

    for label, group in df.groupby("label"):
        elapsed = group["elapsed"]
        error_count = int((group["success"] == False).sum())  # noqa: E712
        count = len(group)

        metrics = EndpointMetrics(
            label=str(label),
            count=count,
            error_count=error_count,
            error_rate_pct=(error_count / count * 100) if count > 0 else 0.0,
            mean_ms=float(elapsed.mean()),
            median_ms=float(elapsed.median()),
            p90_ms=float(elapsed.quantile(0.90)),
            p95_ms=float(elapsed.quantile(0.95)),
            p99_ms=float(elapsed.quantile(0.99)),
            min_ms=float(elapsed.min()),
            max_ms=float(elapsed.max()),
            throughput_rps=count / total_duration_s,
        )
        metrics_list.append(metrics)

    return metrics_list


def evaluate_sla(
    metrics_list: list[EndpointMetrics], criteria: SLACriteria
) -> tuple[bool, list[str]]:
    """SLA 基準に基づいてテスト結果を評価する.

    Args:
        metrics_list: エンドポイントごとのメトリクス
        criteria: SLA 判定基準

    Returns:
        (全体の Pass/Fail, 違反メッセージのリスト)
    """
    violations: list[str] = []

    for m in metrics_list:
        if m.p95_ms > criteria.p95_threshold_ms:
            violations.append(
                f"[{m.label}] P95 {m.p95_ms:.1f}ms > 閾値 {criteria.p95_threshold_ms}ms"
            )

        if m.p99_ms > criteria.p99_threshold_ms:
            violations.append(
                f"[{m.label}] P99 {m.p99_ms:.1f}ms > 閾値 {criteria.p99_threshold_ms}ms"
            )

        if m.error_rate_pct > criteria.error_threshold_pct:
            violations.append(
                f"[{m.label}] エラー率 {m.error_rate_pct:.2f}% > 閾値 {criteria.error_threshold_pct}%"
            )

    passed = len(violations) == 0
    return passed, violations


def generate_markdown_report(
    metrics_list: list[EndpointMetrics],
    sla_passed: bool,
    violations: list[str],
    criteria: SLACriteria,
) -> str:
    """Markdown 形式のレポートを生成する.

    Args:
        metrics_list: エンドポイントごとのメトリクス
        sla_passed: SLA 判定結果
        violations: SLA 違反メッセージ
        criteria: SLA 判定基準

    Returns:
        Markdown 形式のレポート文字列
    """
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    status = "PASSED" if sla_passed else "FAILED"

    lines: list[str] = [
        f"# Load Test Report",
        f"",
        f"**Generated**: {now}",
        f"**SLA Status**: **{status}**",
        f"",
        f"## SLA Criteria",
        f"",
        f"| Metric | Threshold |",
        f"|--------|-----------|",
        f"| P95 Response Time | < {criteria.p95_threshold_ms:.0f}ms |",
        f"| P99 Response Time | < {criteria.p99_threshold_ms:.0f}ms |",
        f"| Error Rate | < {criteria.error_threshold_pct:.1f}% |",
        f"",
    ]

    # SLA 違反がある場合
    if violations:
        lines.extend(
            [
                f"## SLA Violations",
                f"",
            ]
        )
        for v in violations:
            lines.append(f"- {v}")
        lines.append("")

    # エンドポイントごとの詳細
    lines.extend(
        [
            f"## Endpoint Details",
            f"",
            f"| Endpoint | Count | Error% | Mean | P50 | P90 | P95 | P99 | Max | RPS |",
            f"|----------|-------|--------|------|-----|-----|-----|-----|-----|-----|",
        ]
    )

    for m in metrics_list:
        lines.append(
            f"| {m.label} "
            f"| {m.count} "
            f"| {m.error_rate_pct:.2f}% "
            f"| {m.mean_ms:.0f}ms "
            f"| {m.median_ms:.0f}ms "
            f"| {m.p90_ms:.0f}ms "
            f"| {m.p95_ms:.0f}ms "
            f"| {m.p99_ms:.0f}ms "
            f"| {m.max_ms:.0f}ms "
            f"| {m.throughput_rps:.1f} |"
        )

    lines.append("")

    # 全体サマリー
    total_count = sum(m.count for m in metrics_list)
    total_errors = sum(m.error_count for m in metrics_list)
    overall_error_rate = (total_errors / total_count * 100) if total_count > 0 else 0.0
    all_elapsed_p95 = max(m.p95_ms for m in metrics_list) if metrics_list else 0.0
    total_rps = sum(m.throughput_rps for m in metrics_list)

    lines.extend(
        [
            f"## Summary",
            f"",
            f"| Metric | Value |",
            f"|--------|-------|",
            f"| Total Requests | {total_count} |",
            f"| Total Errors | {total_errors} |",
            f"| Overall Error Rate | {overall_error_rate:.2f}% |",
            f"| Max P95 (across endpoints) | {all_elapsed_p95:.0f}ms |",
            f"| Total Throughput | {total_rps:.1f} req/s |",
            f"",
        ]
    )

    return "\n".join(lines)


def main() -> None:
    """エントリポイント."""
    parser = argparse.ArgumentParser(
        description="JMeter CSV 結果ファイルを分析し、Markdown レポートを生成"
    )
    parser.add_argument("input", help="JMeter CSV 結果ファイルのパス")
    parser.add_argument(
        "--output",
        "-o",
        default=None,
        help="出力する Markdown ファイルのパス（省略時は stdout）",
    )
    parser.add_argument(
        "--p95-threshold",
        type=float,
        default=500.0,
        help="P95 レスポンスタイムの閾値 (ms)（デフォルト: 500）",
    )
    parser.add_argument(
        "--p99-threshold",
        type=float,
        default=1000.0,
        help="P99 レスポンスタイムの閾値 (ms)（デフォルト: 1000）",
    )
    parser.add_argument(
        "--error-threshold",
        type=float,
        default=1.0,
        help="エラー率の閾値 (%%)（デフォルト: 1.0）",
    )

    args = parser.parse_args()

    criteria = SLACriteria(
        p95_threshold_ms=args.p95_threshold,
        p99_threshold_ms=args.p99_threshold,
        error_threshold_pct=args.error_threshold,
    )

    # CSV 読み込み
    try:
        df = load_jmeter_csv(args.input)
    except (FileNotFoundError, ValueError) as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    # メトリクス計算
    metrics_list = calculate_metrics(df)

    # SLA 評価
    sla_passed, violations = evaluate_sla(metrics_list, criteria)

    # レポート生成
    report = generate_markdown_report(metrics_list, sla_passed, violations, criteria)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(report, encoding="utf-8")
        print(f"Report saved to: {args.output}")
    else:
        print(report)

    # SLA 違反がある場合は終了コード 1 を返す（CI/CD 連携用）
    if not sla_passed:
        print(f"\nSLA FAILED: {len(violations)} violation(s) found.", file=sys.stderr)
        sys.exit(1)
    else:
        print("\nSLA PASSED: All criteria met.", file=sys.stderr)


if __name__ == "__main__":
    main()
