import json
import pathlib
import re
import sys
from typing import Any

import yaml

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
SETTINGS_FILE = REPO_ROOT / ".github" / "repository.settings.yml"
RULESETS_DIR = REPO_ROOT / ".github" / "rulesets"
OUT_RULESETS_DIR = REPO_ROOT / "ruleset_payloads"

TOPIC_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,49}$")
MAX_TOPICS = 20


def write_json(path: pathlib.Path, data: Any) -> None:
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def main() -> None:
    # Defaults (safe no-op)
    write_json(REPO_ROOT / "repo_patch.json", {})
    # IMPORTANT: topics are optional. Use JSON null to mean "do not touch topics".
    write_json(REPO_ROOT / "topics.json", None)
    write_json(REPO_ROOT / "security.json", {})

    if SETTINGS_FILE.exists():
        settings = yaml.safe_load(SETTINGS_FILE.read_text(encoding="utf-8")) or {}
        if not isinstance(settings, dict):
            raise SystemExit("repository.settings.yml must be a mapping")

        patch_keys = {
            "description",
            "homepage",
            "default_branch",
            "has_issues",
            "has_wiki",
            "allow_squash_merge",
            "allow_merge_commit",
            "allow_rebase_merge",
            "allow_auto_merge",
            "delete_branch_on_merge",
        }

        repo_patch = {
            k: settings.get(k)
            for k in patch_keys
            if k in settings and settings.get(k) is not None
        }

        if "topics" in settings:
            topics = settings.get("topics")
            if topics is None:
                topics = []
            if not isinstance(topics, list):
                raise SystemExit("topics must be a list")
            normalized = [str(t).strip().lower() for t in topics if str(t).strip()]

            # GitHub topic constraints:
            # - max 20 topics
            # - lowercase letters/numbers/hyphens (50 chars max)
            # Enforce this here to prevent workflow failures (HTTP 422).
            seen: set[str] = set()
            deduped: list[str] = []
            invalid: list[str] = []
            for topic in normalized:
                if topic in seen:
                    continue
                if not TOPIC_RE.match(topic):
                    invalid.append(topic)
                    continue
                seen.add(topic)
                deduped.append(topic)

            if invalid:
                sys.stdout.write(
                    f"WARNING: Skipping invalid GitHub topics (must match {TOPIC_RE.pattern}): {', '.join(invalid)}\n"
                )

            if len(deduped) > MAX_TOPICS:
                sys.stdout.write(
                    f"WARNING: Truncating topics list to {MAX_TOPICS} (was {len(deduped)}).\n"
                )
                deduped = deduped[:MAX_TOPICS]

            write_json(REPO_ROOT / "topics.json", deduped)

        security = settings.get("security", {}) or {}
        if not isinstance(security, dict):
            raise SystemExit("security must be a mapping")

        write_json(REPO_ROOT / "repo_patch.json", repo_patch)
        write_json(REPO_ROOT / "security.json", security)

    OUT_RULESETS_DIR.mkdir(parents=True, exist_ok=True)

    if RULESETS_DIR.exists():
        for yml_path in sorted(RULESETS_DIR.glob("*.yml")):
            data = yaml.safe_load(yml_path.read_text(encoding="utf-8")) or {}
            if not isinstance(data, dict):
                raise SystemExit(f"Ruleset {yml_path} must be a mapping")

            # Safety: never rely on hard-coded IDs from YAML
            data.pop("id", None)

            # API compatibility: for some rule types, `parameters` is not allowed.
            # Strip empty parameters blocks to avoid 422 "data matches no possible input".
            rules = data.get("rules")
            if isinstance(rules, list):
                for rule in rules:
                    if isinstance(rule, dict) and rule.get("parameters") == {}:
                        rule.pop("parameters", None)

            out = OUT_RULESETS_DIR / f"{yml_path.stem}.json"
            write_json(out, data)

    # Lightweight logs for debugging
    sys.stdout.write(f"Prepared payloads in {REPO_ROOT}\n")
    sys.stdout.write("Files: repo_patch.json, topics.json, security.json, ruleset_payloads/*.json\n")


if __name__ == "__main__":
    main()
