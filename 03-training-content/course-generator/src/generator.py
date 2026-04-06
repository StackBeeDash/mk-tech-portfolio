"""
AI コース生成ツール

Claude API を使って技術トレーニングのコンテンツを自動生成する。
テンプレートベースのプロンプト設計により、品質の一貫性を確保。
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import click
from anthropic import Anthropic

TEMPLATES_DIR = Path(__file__).parent / "templates"

DEFAULT_MODEL = "claude-sonnet-4-20250514"


def load_template(template_name: str) -> str:
    """テンプレートファイルを読み込む"""
    template_path = TEMPLATES_DIR / template_name
    if not template_path.exists():
        raise FileNotFoundError(f"Template not found: {template_path}")
    return template_path.read_text(encoding="utf-8")


def render_template(
    template: str,
    *,
    topic: str,
    audience: str,
    duration: int,
) -> str:
    """テンプレート内の変数を置換する"""
    return (
        template.replace("{topic}", topic)
        .replace("{audience}", audience)
        .replace("{duration}", str(duration))
    )


def generate_content(
    prompt: str,
    *,
    model: str = DEFAULT_MODEL,
) -> str:
    """Claude API を呼び出してコンテンツを生成する"""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY environment variable is not set. "
            "Set it with: export ANTHROPIC_API_KEY='your-key-here'"
        )

    client = Anthropic(api_key=api_key)

    message = client.messages.create(
        model=model,
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        system=(
            "あなたは経験豊富な技術トレーナーです。"
            "Microsoft Certified Trainer としての視点を持ち、"
            "実践的で分かりやすい教材を作成してください。"
            "出力は Markdown 形式で記述してください。"
        ),
    )

    return message.content[0].text


@click.group()
def cli():
    """AI コース生成ツール - Claude API でトレーニングコンテンツを生成"""
    pass


@cli.command("talk-script")
@click.option("--topic", required=True, help="講座のテーマ")
@click.option("--audience", required=True, help="対象者")
@click.option("--duration", default=60, help="所要時間（分）")
@click.option("--output", default=None, help="出力ファイルパス")
@click.option("--model", default=DEFAULT_MODEL, help="Claude モデル名")
def generate_talk_script(
    topic: str,
    audience: str,
    duration: int,
    output: str | None,
    model: str,
):
    """トークスクリプトを生成する"""
    click.echo(f"Generating talk script: {topic} ({duration}min)...")

    template = load_template("talk_script.txt")
    prompt = render_template(
        template, topic=topic, audience=audience, duration=duration
    )
    result = generate_content(prompt, model=model)

    _write_output(result, output)


@cli.command("slide-outline")
@click.option("--topic", required=True, help="講座のテーマ")
@click.option("--audience", required=True, help="対象者")
@click.option("--duration", default=60, help="所要時間（分）")
@click.option("--output", default=None, help="出力ファイルパス")
@click.option("--model", default=DEFAULT_MODEL, help="Claude モデル名")
def generate_slide_outline(
    topic: str,
    audience: str,
    duration: int,
    output: str | None,
    model: str,
):
    """スライド構成案を生成する"""
    click.echo(f"Generating slide outline: {topic} ({duration}min)...")

    template = load_template("slide_outline.txt")
    prompt = render_template(
        template, topic=topic, audience=audience, duration=duration
    )
    result = generate_content(prompt, model=model)

    _write_output(result, output)


def _write_output(content: str, output_path: str | None) -> None:
    """生成結果を出力する"""
    if output_path:
        Path(output_path).write_text(content, encoding="utf-8")
        click.echo(f"Output written to: {output_path}")
    else:
        click.echo("\n" + content)


if __name__ == "__main__":
    cli()
