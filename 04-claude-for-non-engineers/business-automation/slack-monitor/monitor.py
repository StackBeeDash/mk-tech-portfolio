"""
Slack Channel Monitor — 重要メッセージの自動検知と通知

Slack チャンネルを監視し、重要なメッセージ（障害報告、緊急対応要請、
顧客フィードバック等）を検知して、適切な担当者に通知する。

Usage:
    python monitor.py

Environment Variables:
    SLACK_BOT_TOKEN: Slack Bot Token (xoxb-...)
    SLACK_CHANNEL_ID: 監視対象チャンネル ID
    ANTHROPIC_API_KEY: Claude API Key
    NOTIFICATION_WEBHOOK_URL: 通知先の Webhook URL
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

class Priority(Enum):
    """メッセージの優先度"""
    CRITICAL = "critical"  # 即座に対応が必要
    HIGH = "high"          # 数時間以内に対応
    MEDIUM = "medium"      # 翌営業日までに対応
    LOW = "low"            # 情報共有のみ


@dataclass
class MonitorConfig:
    """監視設定"""
    channel_id: str = "C_DEMO_CHANNEL"
    check_interval_seconds: int = 60
    keywords_critical: list[str] = field(default_factory=lambda: [
        "障害", "ダウン", "停止", "緊急", "インシデント",
        "outage", "down", "critical", "incident",
    ])
    keywords_high: list[str] = field(default_factory=lambda: [
        "バグ", "エラー", "不具合", "遅延", "タイムアウト",
        "bug", "error", "timeout", "degraded",
    ])
    keywords_medium: list[str] = field(default_factory=lambda: [
        "要望", "改善", "提案", "質問",
        "request", "improvement", "suggestion", "question",
    ])


# ---------------------------------------------------------------------------
# Message Analysis
# ---------------------------------------------------------------------------

@dataclass
class AnalysisResult:
    """メッセージ分析結果"""
    priority: Priority
    summary: str
    suggested_action: str
    mentioned_users: list[str]
    timestamp: str


def classify_message(text: str, config: MonitorConfig) -> Priority:
    """キーワードベースの優先度分類"""
    text_lower = text.lower()

    for keyword in config.keywords_critical:
        if keyword.lower() in text_lower:
            return Priority.CRITICAL

    for keyword in config.keywords_high:
        if keyword.lower() in text_lower:
            return Priority.HIGH

    for keyword in config.keywords_medium:
        if keyword.lower() in text_lower:
            return Priority.MEDIUM

    return Priority.LOW


def extract_mentions(text: str) -> list[str]:
    """Slack メンション（<@U...>）を抽出"""
    return re.findall(r"<@(U[A-Z0-9]+)>", text)


def analyze_message(text: str, config: MonitorConfig) -> AnalysisResult:
    """メッセージを分析し、優先度と推奨アクションを返す"""
    priority = classify_message(text, config)
    mentions = extract_mentions(text)

    # 優先度に応じた推奨アクション
    action_map = {
        Priority.CRITICAL: "即座にオンコール担当者へエスカレーション。障害対応チャンネルを作成。",
        Priority.HIGH: "担当エンジニアにアサインし、2時間以内の初動対応を依頼。",
        Priority.MEDIUM: "バックログに追加し、次のスプリントで対応を検討。",
        Priority.LOW: "情報として記録。対応不要。",
    }

    # 簡易サマリ生成（本番では Claude API を使用）
    summary = text[:100] + ("..." if len(text) > 100 else "")

    return AnalysisResult(
        priority=priority,
        summary=summary,
        suggested_action=action_map[priority],
        mentioned_users=mentions,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


# ---------------------------------------------------------------------------
# Notification
# ---------------------------------------------------------------------------

@dataclass
class Notification:
    """通知データ"""
    channel: str
    priority: Priority
    summary: str
    action: str
    original_text: str
    timestamp: str


def format_notification(analysis: AnalysisResult, original_text: str) -> Notification:
    """分析結果を通知フォーマットに変換"""
    return Notification(
        channel="C_DEMO_CHANNEL",
        priority=analysis.priority,
        summary=analysis.summary,
        action=analysis.suggested_action,
        original_text=original_text,
        timestamp=analysis.timestamp,
    )


def send_notification(notification: Notification) -> bool:
    """
    通知を送信する（デモ実装: コンソールに出力）

    本番では:
    - Slack Webhook で通知チャンネルに投稿
    - PagerDuty でオンコール担当者に通知（CRITICAL）
    - Jira/Linear でチケット自動作成（HIGH/MEDIUM）
    """
    priority_emoji = {
        Priority.CRITICAL: "🚨",
        Priority.HIGH: "⚠️",
        Priority.MEDIUM: "📋",
        Priority.LOW: "ℹ️",
    }

    emoji = priority_emoji[notification.priority]
    print(f"\n{'=' * 50}")
    print(f"{emoji} [{notification.priority.value.upper()}] New Alert")
    print(f"{'=' * 50}")
    print(f"Summary: {notification.summary}")
    print(f"Action:  {notification.action}")
    print(f"Time:    {notification.timestamp}")
    print(f"{'=' * 50}\n")

    return True


# ---------------------------------------------------------------------------
# Demo Execution
# ---------------------------------------------------------------------------

# デモ用のサンプルメッセージ
DEMO_MESSAGES = [
    "本番環境でAPIがダウンしています。エラー500が返ります。<@U001DEV> 至急確認お願いします。",
    "ログイン画面でタイムアウトエラーが発生しているとの報告がありました。",
    "新しいダッシュボード機能について改善要望があります。グラフの色をカスタマイズしたいとのこと。",
    "今週のスプリントレビューは金曜15時からです。",
    "緊急: 決済システムで二重課金のインシデントが発生。<@U002LEAD> <@U003OPS> 対応お願いします。",
]


def run_demo() -> None:
    """デモ実行: サンプルメッセージを分析して通知する"""
    config = MonitorConfig()

    print("Slack Monitor Demo")
    print(f"Monitoring channel: {config.channel_id}")
    print(f"Processing {len(DEMO_MESSAGES)} demo messages...\n")

    results: list[tuple[str, AnalysisResult]] = []

    for message in DEMO_MESSAGES:
        analysis = analyze_message(message, config)
        results.append((message, analysis))

        # MEDIUM 以上の優先度のみ通知
        if analysis.priority in (Priority.CRITICAL, Priority.HIGH, Priority.MEDIUM):
            notification = format_notification(analysis, message)
            send_notification(notification)

    # サマリ出力
    print("\n" + "=" * 50)
    print("Summary")
    print("=" * 50)
    for priority in Priority:
        count = sum(1 for _, a in results if a.priority == priority)
        print(f"  {priority.value:10s}: {count}")
    print(f"  {'Total':10s}: {len(results)}")


if __name__ == "__main__":
    run_demo()
