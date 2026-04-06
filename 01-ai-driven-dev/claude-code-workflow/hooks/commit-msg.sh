#!/usr/bin/env bash
# =============================================================================
# Commit-msg Hook — Conventional Commits の検証
# =============================================================================
# Purpose: コミットメッセージが Conventional Commits 形式に準拠しているか検証する
# Install: cp hooks/commit-msg.sh .git/hooks/commit-msg && chmod +x .git/hooks/commit-msg
# =============================================================================

set -euo pipefail

COMMIT_MSG_FILE="$1"
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Conventional Commits パターン
# type(scope)?: description
PATTERN='^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?: .+'

# マージコミットはスキップ
if echo "$COMMIT_MSG" | grep -qE '^Merge '; then
    exit 0
fi

# Co-Authored-By 行を除外して最初の行を検証
FIRST_LINE=$(echo "$COMMIT_MSG" | head -1)

if ! echo "$FIRST_LINE" | grep -qE "$PATTERN"; then
    echo "❌ ERROR: Invalid commit message format."
    echo ""
    echo "Expected format: <type>(<scope>): <description>"
    echo ""
    echo "Valid types:"
    echo "  feat     — A new feature"
    echo "  fix      — A bug fix"
    echo "  docs     — Documentation only changes"
    echo "  style    — Code style changes (formatting, semicolons, etc)"
    echo "  refactor — Code change that neither fixes a bug nor adds a feature"
    echo "  perf     — Performance improvement"
    echo "  test     — Adding or updating tests"
    echo "  build    — Build system or dependency changes"
    echo "  ci       — CI configuration changes"
    echo "  chore    — Other changes that don't modify src or test files"
    echo "  revert   — Reverts a previous commit"
    echo ""
    echo "Examples:"
    echo "  feat(auth): add OAuth2 login flow"
    echo "  fix: resolve race condition in data fetching"
    echo "  docs(api): update endpoint documentation"
    echo ""
    echo "Your message: ${FIRST_LINE}"
    exit 1
fi

# タイトル長の検証（72文字以内）
TITLE_LENGTH=${#FIRST_LINE}
if [ "$TITLE_LENGTH" -gt 72 ]; then
    echo "⚠️  WARNING: Commit title is ${TITLE_LENGTH} characters (recommended: 72 max)."
    echo "   Consider shortening: ${FIRST_LINE}"
    # Warning only — don't block the commit
fi

echo "✅ Commit message format is valid."
