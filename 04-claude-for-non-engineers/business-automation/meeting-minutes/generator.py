"""
Meeting Minutes Generator -- 議事録自動生成

音声文字起こし（トランスクリプト）から構造化された議事録を生成する。
Claude API を使用して、発言内容を要約し、決定事項とアクションアイテムを抽出する。

Usage:
    python generator.py

Environment Variables:
    ANTHROPIC_API_KEY: Claude API Key
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional


# ---------------------------------------------------------------------------
# Data Models
# ---------------------------------------------------------------------------

@dataclass
class ActionItem:
    """アクションアイテム"""
    description: str
    assignee: str
    due_date: Optional[str] = None
    priority: str = "medium"  # high, medium, low


@dataclass
class Decision:
    """決定事項"""
    description: str
    rationale: str
    decided_by: str


@dataclass
class AgendaItem:
    """議題"""
    title: str
    summary: str
    key_points: list[str]
    decisions: list[Decision]
    action_items: list[ActionItem]


@dataclass
class MeetingMinutes:
    """議事録"""
    title: str
    date: str
    attendees: list[str]
    duration_minutes: int
    agenda_items: list[AgendaItem]
    next_meeting: Optional[str] = None
    generated_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


# ---------------------------------------------------------------------------
# Transcript Parser
# ---------------------------------------------------------------------------

@dataclass
class Utterance:
    """発言"""
    speaker: str
    text: str
    timestamp: str


def parse_transcript(raw_transcript: str) -> list[Utterance]:
    """
    文字起こしテキストをパースして発言リストにする。

    Expected format:
        [00:00:15] 田中: こんにちは、始めましょう。
        [00:00:22] 鈴木: はい、よろしくお願いします。
    """
    utterances: list[Utterance] = []

    for line in raw_transcript.strip().split("\n"):
        line = line.strip()
        if not line:
            continue

        # [HH:MM:SS] Speaker: Text
        import re
        match = re.match(r"\[(\d{2}:\d{2}:\d{2})\]\s*(.+?):\s*(.+)", line)
        if match:
            utterances.append(Utterance(
                timestamp=match.group(1),
                speaker=match.group(2).strip(),
                text=match.group(3).strip(),
            ))

    return utterances


# ---------------------------------------------------------------------------
# Minutes Generation (Demo)
# ---------------------------------------------------------------------------

def generate_minutes_from_transcript(
    transcript: str,
    meeting_title: str = "Team Meeting",
) -> MeetingMinutes:
    """
    トランスクリプトから議事録を生成する。

    デモ実装: ルールベースで抽出。
    本番実装: Claude API を使用してインテリジェントに要約・抽出する。

    本番での Claude API 呼び出し例:
        client = anthropic.Anthropic()
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system="You are a meeting minutes generator...",
            messages=[{"role": "user", "content": transcript}],
        )
    """
    utterances = parse_transcript(transcript)

    # 参加者の抽出
    attendees = sorted(set(u.speaker for u in utterances))

    # 時間の計算
    if utterances:
        start = utterances[0].timestamp
        end = utterances[-1].timestamp
        start_parts = [int(x) for x in start.split(":")]
        end_parts = [int(x) for x in end.split(":")]
        duration = (
            (end_parts[0] - start_parts[0]) * 60
            + (end_parts[1] - start_parts[1])
        )
    else:
        duration = 0

    # デモ: キーワードベースでアクションアイテムと決定事項を抽出
    action_items: list[ActionItem] = []
    decisions: list[Decision] = []
    key_points: list[str] = []

    action_keywords = ["担当", "対応する", "やります", "進める", "作成する", "確認する"]
    decision_keywords = ["決定", "決まり", "にしましょう", "で行きます", "に決定"]

    for u in utterances:
        for kw in action_keywords:
            if kw in u.text:
                action_items.append(ActionItem(
                    description=u.text,
                    assignee=u.speaker,
                ))
                break
        for kw in decision_keywords:
            if kw in u.text:
                decisions.append(Decision(
                    description=u.text,
                    rationale="会議での合意",
                    decided_by=u.speaker,
                ))
                break

        # 長めの発言は key point として扱う
        if len(u.text) > 30:
            key_points.append(f"{u.speaker}: {u.text}")

    agenda = AgendaItem(
        title="メイン議題",
        summary=f"{len(utterances)} 件の発言を分析",
        key_points=key_points[:5],
        decisions=decisions,
        action_items=action_items,
    )

    return MeetingMinutes(
        title=meeting_title,
        date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        attendees=attendees,
        duration_minutes=max(duration, 1),
        agenda_items=[agenda],
    )


def format_minutes_markdown(minutes: MeetingMinutes) -> str:
    """議事録を Markdown 形式にフォーマット"""
    lines = [
        f"# {minutes.title}",
        "",
        f"- **日時**: {minutes.date}",
        f"- **参加者**: {', '.join(minutes.attendees)}",
        f"- **所要時間**: {minutes.duration_minutes} 分",
        "",
    ]

    for i, agenda in enumerate(minutes.agenda_items, 1):
        lines.append(f"## {i}. {agenda.title}")
        lines.append("")
        lines.append(agenda.summary)
        lines.append("")

        if agenda.key_points:
            lines.append("### 要点")
            for point in agenda.key_points:
                lines.append(f"- {point}")
            lines.append("")

        if agenda.decisions:
            lines.append("### 決定事項")
            for d in agenda.decisions:
                lines.append(f"- **{d.description}** (提案: {d.decided_by})")
            lines.append("")

        if agenda.action_items:
            lines.append("### アクションアイテム")
            lines.append("")
            lines.append("| 内容 | 担当者 | 優先度 |")
            lines.append("|------|--------|--------|")
            for a in agenda.action_items:
                lines.append(f"| {a.description} | {a.assignee} | {a.priority} |")
            lines.append("")

    if minutes.next_meeting:
        lines.append(f"## 次回ミーティング")
        lines.append(f"- {minutes.next_meeting}")

    lines.append("")
    lines.append(f"---")
    lines.append(f"*Generated at {minutes.generated_at}*")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Demo Execution
# ---------------------------------------------------------------------------

DEMO_TRANSCRIPT = """
[00:00:05] 田中: それでは定例ミーティングを始めます。今日の議題はリリース計画についてです。
[00:00:15] 鈴木: 先週のスプリントで認証機能の実装が完了しました。テストも全て通っています。
[00:00:30] 佐藤: フロントエンドのレビューも終わっています。デザインチームからのフィードバックも反映済みです。
[00:01:00] 田中: 素晴らしい。では来週月曜日にステージング環境へデプロイで行きましょう。これに決定です。
[00:01:20] 鈴木: 了解です。ステージング環境のセットアップは私が担当します。金曜までに対応する予定です。
[00:01:45] 佐藤: QAチームへのテスト依頼は私が作成します。テストケースのドキュメントも準備します。
[00:02:10] 田中: パフォーマンステストも必要ですね。負荷テストのシナリオを鈴木さん確認してもらえますか。
[00:02:30] 鈴木: はい、負荷テストのシナリオを確認します。前回の結果と比較できるようにしておきます。
[00:02:50] 佐藤: セキュリティレビューについてはどうしましょうか。外部監査を入れる方針にしましょう。
[00:03:10] 田中: 賛成です。外部セキュリティ監査を実施する方針に決定します。予算は確認する必要があります。
[00:03:30] 田中: 他に何かありますか？なければこれで終わりにしましょう。次回は来週水曜日です。
""".strip()


def run_demo() -> None:
    """デモ実行"""
    print("Meeting Minutes Generator Demo")
    print("=" * 50)

    minutes = generate_minutes_from_transcript(
        transcript=DEMO_TRANSCRIPT,
        meeting_title="週次定例ミーティング",
    )

    markdown = format_minutes_markdown(minutes)
    print(markdown)

    # JSON 出力も可能
    print("\n\n--- JSON Output ---\n")
    import dataclasses
    print(json.dumps(dataclasses.asdict(minutes), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    run_demo()
