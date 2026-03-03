# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
