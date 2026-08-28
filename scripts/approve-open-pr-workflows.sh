#!/usr/bin/env bash
# Approve waiting workflow runs for open PRs using `gh` and `jq`.
# Usage: ./scripts/approve-open-pr-workflows.sh [owner/repo]
# Requires: gh CLI authenticated (or set GH_TOKEN), jq installed.
# Approve waiting workflow runs for open PRs using `gh` and `jq`.
# Usage: ./scripts/approve-open-pr-workflows.sh [owner/repo]
# Requires: gh CLI authenticated (or set GH_TOKEN), jq installed.

set -euo pipefail
REPO=${1:-}
if [ -z "$REPO" ]; then
  REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
  if [ -z "$REPO" ]; then
    echo "Repository not specified and could not detect from gh. Use: $0 owner/repo" >&2
    exit 2
  fi
fi

echo "Using repo: $REPO"

# Optional env flags
DEPENDABOT_ONLY=${DEPENDABOT_ONLY:-true}
# Comma-separated workflow names to include (empty = any)
WORKFLOWS=${WORKFLOWS:-}

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "Fetching open PRs..."
gh api repos/$REPO/pulls --jq '.' > "$TMPDIR/prs.json" 2>"$TMPDIR/prs.err" || true

echo "Fetching recent workflow runs..."
gh api "repos/$REPO/actions/runs?event=pull_request&per_page=100" --jq '.' > "$TMPDIR/runs.json" 2>"$TMPDIR/runs.err" || true

if ! jq -e . "$TMPDIR/prs.json" >/dev/null 2>&1; then
  echo "prs.json is not valid JSON" >&2
  sed -n '1,200p' "$TMPDIR/prs.err" >&2 || true
  exit 3
fi
if ! jq -e . "$TMPDIR/runs.json" >/dev/null 2>&1; then
  echo "runs.json is not valid JSON" >&2
  sed -n '1,200p' "$TMPDIR/runs.err" >&2 || true
  exit 3
fi

PR_COUNT=$(jq 'length' "$TMPDIR/prs.json")
echo "Found $PR_COUNT open PR(s)"

RUNS_COUNT=$(jq '.workflow_runs | length' "$TMPDIR/runs.json")
echo "Checked $RUNS_COUNT recent workflow run(s)"

APPROVED=0

# Iterate PRs
jq -c '.[]' "$TMPDIR/prs.json" | while read -r row; do
  PR_NUMBER=$(echo "$row" | jq -r '.number')
  PR_HEAD_SHA=$(echo "$row" | jq -r '.head.sha')

  # Build jq filter for matching runs
  if [ -n "$PR_NUMBER" ]; then
    MATCH_FILTER="(.pull_requests | any(.number == ($PR_NUMBER|tonumber))) or (.head_sha == \"$PR_HEAD_SHA\")"
  else
    MATCH_FILTER="(.head_sha == \"$PR_HEAD_SHA\")"
  fi

  # Find runs for this PR that are waiting/requested
  matches=$(jq -c --arg prnum "$PR_NUMBER" --arg headsha "$PR_HEAD_SHA" '.workflow_runs[] | select((.pull_requests | any(.number == ($prnum|tonumber))) or (.head_sha == $headsha)) | select(.status=="waiting" or .status=="requested")' "$TMPDIR/runs.json" 2>/dev/null || true)
  if [ -z "$matches" ]; then
    continue
  fi

  echo "$matches" | while read -r run; do
    RUN_ID=$(echo "$run" | jq -r '.id')
    RUN_NAME=$(echo "$run" | jq -r '.name')
    ACTOR=$(echo "$run" | jq -r '.actor.login // ""')

    if [ "${DEPENDABOT_ONLY}" = "true" ]; then
      if [[ "${ACTOR,,}" != dependabot* ]]; then
        echo "SKIP run $RUN_ID for PR #$PR_NUMBER (actor $ACTOR)"
        continue
      fi
    fi

    if [ -n "$WORKFLOWS" ]; then
      IFS="," read -ra WF <<< "$WORKFLOWS"
      keep=false
      for w in "${WF[@]}"; do
        if [ "$w" = "$RUN_NAME" ]; then keep=true; break; fi
      done
      if [ "$keep" = false ]; then
        echo "SKIP run $RUN_ID for PR #$PR_NUMBER (workflow $RUN_NAME not in filter)"
        continue
      fi
    fi

    echo "Approving run $RUN_ID for PR #$PR_NUMBER (workflow: $RUN_NAME)"
    gh api -X POST repos/$REPO/actions/runs/$RUN_ID/approve || echo "approve failed for $RUN_ID"
    APPROVED=$((APPROVED+1))
  done

done

echo "Total approved runs: $APPROVED"

exit 0
