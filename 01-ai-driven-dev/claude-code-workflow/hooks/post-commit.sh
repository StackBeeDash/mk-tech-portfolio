#!/usr/bin/env bash
# =============================================================================
# Post-commit Hook for Claude Code Projects
# =============================================================================
# Purpose: コミット後の自動化タスク（通知、ドキュメント更新等）
# Install: cp hooks/post-commit.sh .git/hooks/post-commit && chmod +x .git/hooks/post-commit
# =============================================================================

set -euo pipefail

# コミット情報の取得
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
AUTHOR=$(git log -1 --pretty=%an)
CHANGED_FILES=$(git diff-tree --no-commit-id --name-only -r HEAD)

echo "📝 Post-commit: ${COMMIT_HASH} on ${BRANCH}"

# ---------------------------------------------------------------------------
# 1. コミットログの記録
# ---------------------------------------------------------------------------
LOG_DIR=".claude/logs"
if [ -d ".claude" ]; then
    mkdir -p "$LOG_DIR"
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ${COMMIT_HASH} | ${BRANCH} | ${AUTHOR} | ${COMMIT_MSG}" \
        >> "${LOG_DIR}/commits.log"
fi

# ---------------------------------------------------------------------------
# 2. Issue 自動リンク（コミットメッセージに #XX がある場合）
# ---------------------------------------------------------------------------
ISSUE_REFS=$(echo "$COMMIT_MSG" | grep -oE '#[0-9]+' || true)
if [ -n "$ISSUE_REFS" ]; then
    echo "  📌 Referenced issues: ${ISSUE_REFS}"
    # GitHub CLI が利用可能な場合、Issue にコメントを追加
    if command -v gh &> /dev/null; then
        for issue in $(echo "$ISSUE_REFS" | tr '#' ' '); do
            gh issue comment "$issue" \
                --body "Referenced in commit \`${COMMIT_HASH}\` on branch \`${BRANCH}\`" \
                2>/dev/null || true
        done
    fi
fi

# ---------------------------------------------------------------------------
# 3. CHANGELOG 候補の自動生成
# ---------------------------------------------------------------------------
if echo "$COMMIT_MSG" | grep -qE '^(feat|fix|breaking):'; then
    CHANGELOG_ENTRY=""
    if echo "$COMMIT_MSG" | grep -qE '^feat:'; then
        CHANGELOG_ENTRY="### Added\n- ${COMMIT_MSG#feat: }"
    elif echo "$COMMIT_MSG" | grep -qE '^fix:'; then
        CHANGELOG_ENTRY="### Fixed\n- ${COMMIT_MSG#fix: }"
    elif echo "$COMMIT_MSG" | grep -qE '^breaking:'; then
        CHANGELOG_ENTRY="### Breaking Changes\n- ${COMMIT_MSG#breaking: }"
    fi

    if [ -n "$CHANGELOG_ENTRY" ]; then
        CHANGELOG_DRAFT=".claude/changelog-draft.md"
        mkdir -p "$(dirname "$CHANGELOG_DRAFT")"
        echo -e "\n${CHANGELOG_ENTRY} (${COMMIT_HASH})" >> "$CHANGELOG_DRAFT"
        echo "  📋 CHANGELOG draft updated."
    fi
fi

# ---------------------------------------------------------------------------
# 4. 統計情報の出力
# ---------------------------------------------------------------------------
FILES_CHANGED=$(echo "$CHANGED_FILES" | wc -l | tr -d ' ')
INSERTIONS=$(git diff --stat HEAD~1 HEAD 2>/dev/null | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo "0")
DELETIONS=$(git diff --stat HEAD~1 HEAD 2>/dev/null | tail -1 | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+' || echo "0")

echo "  📊 Stats: ${FILES_CHANGED} files changed, +${INSERTIONS}/-${DELETIONS}"
echo "  ✅ Post-commit tasks completed."
