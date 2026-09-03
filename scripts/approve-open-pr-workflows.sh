#!/usr/bin/env bash
# Approve waiting workflow runs for open PRs using only the `gh` CLI.
# Usage: ./scripts/approve-open-pr-workflows.sh [owner/repo]
# Requires: gh CLI authenticated (or set GH_TOKEN). Does NOT require `jq`.

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

echo "Fetching open PR numbers..."
PR_NUMBERS=$(gh api repos/$REPO/pulls --jq '.[].number' 2>/dev/null || true)
if [ -z "$PR_NUMBERS" ]; then
  echo "No open PRs found or 'gh' failed to list PRs." >&2
  exit 0
fi

APPROVED=0

# Iterate PR numbers and fetch head shas per-PR using gh --jq (no external jq required)
while read -r PR_NUMBER; do
  [ -z "$PR_NUMBER" ] && continue
  PR_HEAD_SHA=$(gh api repos/$REPO/pulls/$PR_NUMBER --jq '.head.sha' 2>/dev/null || true)
  if [ -z "$PR_HEAD_SHA" ]; then
    echo "Could not get head SHA for PR #$PR_NUMBER, skipping." >&2
    continue
  fi

  # Query workflow runs for this head_sha and only output matching runs as tab-separated lines: id\tname\tactor
  runs_output=$(gh api "repos/$REPO/actions/runs?event=pull_request&per_page=100&head_sha=$PR_HEAD_SHA" --jq '.workflow_runs[] | select(.status=="waiting" or .status=="requested") | "\(.id)\t\(.name)\t\(.actor.login // "")"' 2>/dev/null || true)
  if [ -z "$runs_output" ]; then
    continue
  fi

  # Process each matching run line
  echo "$runs_output" | while IFS=$'\t' read -r RUN_ID RUN_NAME ACTOR; do
    if [ -z "$RUN_ID" ]; then
      continue
    fi

    if [ "${DEPENDABOT_ONLY}" = "true" ]; then
      ACTOR_LOWER=$(echo "$ACTOR" | tr '[:upper:]' '[:lower:]')
      case "$ACTOR_LOWER" in
        dependabot* ) ;;
        * ) echo "SKIP run $RUN_ID for PR #$PR_NUMBER (actor $ACTOR)"; continue ;;
      esac
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

done <<< "$PR_NUMBERS"

echo "Total approved runs: $APPROVED"

exit 0
