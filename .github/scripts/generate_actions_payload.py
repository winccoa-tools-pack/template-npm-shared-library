#!/usr/bin/env python3
"""
Generate `actions_payload.json` / `workflow_payload.json` from .github/repository.settings.yml

This script is small and safe to run in CI. It writes:
- actions_payload.json when an `actions_permissions` block is present
- workflow_payload.json when a `workflow_permissions` block is present
"""
import json
import sys
from pathlib import Path

try:
    import yaml
except Exception:
    print("Missing PyYAML; ensure 'pyyaml' is installed in the runner", file=sys.stderr)
    raise

cfg_path = Path('.github/repository.settings.yml')
if not cfg_path.exists():
    sys.exit(0)

cfg = yaml.safe_load(cfg_path.read_text(encoding='utf-8')) or {}
written = False

ap = cfg.get('actions_permissions')
if ap:
    out = {}
    if 'enabled' in ap:
        out['enabled'] = bool(ap['enabled'])
    if 'allowed_actions' in ap:
        out['allowed_actions'] = ap['allowed_actions']
    if isinstance(ap.get('selected_actions'), dict) and 'apps' in ap.get('selected_actions'):
        out['selected_actions'] = {'apps': ap['selected_actions']['apps']}
    if out:
        Path('actions_payload.json').write_text(json.dumps(out, ensure_ascii=False), encoding='utf-8')
        print('WROTE actions_payload.json')
        written = True

# Optional: emit repository-level workflow permissions payload
wp = cfg.get('workflow_permissions')
if isinstance(wp, dict):
    wout = {}
    if 'default_workflow_permissions' in wp:
        # expect 'read' or 'write'
        wout['default_workflow_permissions'] = wp['default_workflow_permissions']
    if 'can_approve_pull_request_reviews' in wp:
        wout['can_approve_pull_request_reviews'] = bool(wp['can_approve_pull_request_reviews'])

    if wout:
        Path('workflow_payload.json').write_text(json.dumps(wout, ensure_ascii=False), encoding='utf-8')
        print('WROTE workflow_payload.json')
        written = True

if not written:
    # nothing emitted
    sys.exit(0)
