# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2026-09-03

### Changed

- deps-dev(deps-dev): bump eslint from 9.39.3 to 9.39.5 (#80)
- deps-dev(deps-dev): bump typescript-eslint from 8.56.1 to 8.68.0 (#78)
- deps-dev(deps-dev): bump prettier (#74)
- deps-dev(deps-dev): bump @types/node from 25.6.0 to 26.4.0 (#75)
- deps-dev(deps-dev): bump markdownlint from 0.40.0 to 0.41.1 (#76)
- reduce Node.js versions in CI/CD pipeline for faster execution (#92)
- deps-dev(deps-dev): bump @humanfs/node from 0.16.7 to 0.16.8 (#86)
- feat(DevOps) Update rebase-open-prs-action to use v1.2.4 (#91)
- add workflow_dispatch to rebase-open-prs for manual runs (#90)
- bump actions/checkout from 4 to 7 (#89)
- Just next try to automate gh workflows (#88)
- deps-dev(deps-dev): bump tsx from 4.23.12 to 4.23.13 (#87)
- deps-dev(deps-dev): bump globals from 17.6.0 to 17.11.0 (#79)
- bump actions/checkout from 6 to 7 (#83)
- bump dependabot/fetch-metadata from 1 to 3 (#84)

## [0.2.0] - 2026-03-03

### Changed

- Add changelog generation and validation scripts, update workflows, and repository settings (#33)
- Add peer dependencies to package-lock.json and implement CLI tests for argument parsing (#32)
- update template
- Add actions to sync org and template files
- Update sync-template-files.yml
- Update sync-template-files.yml
- Create sync-template-files.yml
- Create sync-org-files.yml
- Update bug_report.yml
- upmerge from core npm
- bump actions/upload-artifact from 5 to 6
- add setup-gitflow and gitflow-action workflows
- Add Buy Me a Coffee funding option

## [Unreleased]

### Documentation

- Align README CLI/API examples with actual tool behavior (in-place conversion, required version).

## [0.1.0] - 2026-02-28

### Added

- Core converter `PnlXmlConverter` wrapping WinCC OA `WCCOAui` `-xmlConvert`.
- CLI `winccoa-pnl-xml` with `convert pnl-to-xml` / `convert xml-to-pnl`.
- TypeScript API convenience functions `pnlToXml()` and `xmlToPnl()`.
- Unit tests covering CLI parsing, API wrappers, and converter arguments.
