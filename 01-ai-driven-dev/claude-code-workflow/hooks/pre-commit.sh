#!/usr/bin/env bash
# =============================================================================
# Pre-commit Hook for Claude Code Projects
# =============================================================================
# Purpose: コミット前に品質チェックを自動実行する
# Install: cp hooks/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
# =============================================================================

set -euo pipefail

echo "🔍 Running pre-commit checks..."

# ---------------------------------------------------------------------------
# 1. Secrets Detection — 機密情報の混入を防止
# ---------------------------------------------------------------------------
echo "  [1/5] Checking for secrets..."

# API キー、トークン、パスワードのパターンを検出
SECRETS_PATTERN='(AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{48}|ghp_[a-zA-Z0-9]{36}|password\s*=\s*["\x27][^"\x27]+["\x27])'

if git diff --cached --diff-filter=ACM -z --name-only | \
   xargs -0 grep -lP "$SECRETS_PATTERN" 2>/dev/null; then
    echo "❌ ERROR: Potential secrets detected in staged files."
    echo "   Please remove credentials before committing."
    exit 1
fi

# .env ファイルのコミットを防止
if git diff --cached --name-only | grep -q '\.env$\|\.env\.local$\|\.env\.production$'; then
    echo "❌ ERROR: .env file detected in staged changes."
    echo "   Add .env files to .gitignore."
    exit 1
fi

echo "  ✅ No secrets found."

# ---------------------------------------------------------------------------
# 2. TypeScript Type Check — 型エラーの検出
# ---------------------------------------------------------------------------
if [ -f "tsconfig.json" ]; then
    echo "  [2/5] Running TypeScript type check..."
    if command -v npx &> /dev/null; then
        npx tsc --noEmit --pretty 2>&1 || {
            echo "❌ ERROR: TypeScript type errors found."
            exit 1
        }
        echo "  ✅ Type check passed."
    else
        echo "  ⏭️  Skipping type check (npx not available)."
    fi
else
    echo "  ⏭️  Skipping type check (no tsconfig.json)."
fi

# ---------------------------------------------------------------------------
# 3. Lint — コーディング規約の確認
# ---------------------------------------------------------------------------
echo "  [3/5] Running linter..."

if [ -f "package.json" ] && grep -q '"lint"' package.json; then
    # ステージされたファイルのみ lint
    STAGED_TS_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)
    if [ -n "$STAGED_TS_FILES" ]; then
        echo "$STAGED_TS_FILES" | xargs npx eslint --fix --max-warnings=0 2>&1 || {
            echo "❌ ERROR: Lint errors found."
            exit 1
        }
        # lint --fix で修正されたファイルを再ステージ
        echo "$STAGED_TS_FILES" | xargs git add
        echo "  ✅ Lint passed."
    else
        echo "  ⏭️  No TypeScript/JavaScript files staged."
    fi
elif [ -f "pyproject.toml" ] || [ -f "setup.cfg" ]; then
    STAGED_PY_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.py$' || true)
    if [ -n "$STAGED_PY_FILES" ]; then
        echo "$STAGED_PY_FILES" | xargs python -m ruff check --fix 2>&1 || {
            echo "❌ ERROR: Python lint errors found."
            exit 1
        }
        echo "$STAGED_PY_FILES" | xargs git add
        echo "  ✅ Lint passed."
    else
        echo "  ⏭️  No Python files staged."
    fi
else
    echo "  ⏭️  Skipping lint (no lint configuration found)."
fi

# ---------------------------------------------------------------------------
# 4. Format Check — コードフォーマットの確認
# ---------------------------------------------------------------------------
echo "  [4/5] Checking code format..."

if [ -f "package.json" ] && grep -q '"prettier"' package.json 2>/dev/null; then
    STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|json|md)$' || true)
    if [ -n "$STAGED_FILES" ]; then
        echo "$STAGED_FILES" | xargs npx prettier --check 2>&1 || {
            echo "❌ ERROR: Formatting issues found. Run 'npx prettier --write .' to fix."
            exit 1
        }
        echo "  ✅ Format check passed."
    fi
else
    echo "  ⏭️  Skipping format check."
fi

# ---------------------------------------------------------------------------
# 5. Test — 関連テストの実行
# ---------------------------------------------------------------------------
echo "  [5/5] Running related tests..."

STAGED_SRC_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|py)$' | grep -v '\.test\.\|\.spec\.\|__test__' || true)

if [ -n "$STAGED_SRC_FILES" ]; then
    # 変更されたファイルに対応するテストファイルを検索
    TEST_FILES=""
    for src_file in $STAGED_SRC_FILES; do
        base="${src_file%.*}"
        ext="${src_file##*.}"
        for test_file in "${base}.test.${ext}" "${base}.spec.${ext}"; do
            if [ -f "$test_file" ]; then
                TEST_FILES="$TEST_FILES $test_file"
            fi
        done
    done

    if [ -n "$TEST_FILES" ]; then
        if [ -f "package.json" ] && grep -q '"vitest"' package.json 2>/dev/null; then
            npx vitest run $TEST_FILES --reporter=verbose 2>&1 || {
                echo "❌ ERROR: Tests failed."
                exit 1
            }
        elif [ -f "package.json" ] && grep -q '"jest"' package.json 2>/dev/null; then
            npx jest $TEST_FILES --verbose 2>&1 || {
                echo "❌ ERROR: Tests failed."
                exit 1
            }
        fi
        echo "  ✅ Tests passed."
    else
        echo "  ⏭️  No related test files found."
    fi
else
    echo "  ⏭️  No source files staged."
fi

echo ""
echo "✅ All pre-commit checks passed!"
