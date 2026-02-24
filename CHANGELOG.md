# Changelog

## [0.2.0] - 2026-02-23

### Added
- Core HTTP client with retry logic, rate-limit handling (429 backoff), and auto-pagination
- 6-level credential resolution chain (flags, env vars, config profiles)
- Multi-format output: table, JSON, YAML, CSV, TSV, plain
- Zone management: list, get, create, delete
- DNS record management: list, get, create, update, patch, delete, export, import
- Account management: list, get
- User info and token verification
- Cache purge (by URL, tag, prefix, or full purge)
- Config management: profiles, set, get, delete, list, use
- Shell completions: bash, zsh, fish
- CI/CD: GitHub Actions for lint/typecheck/test on PR, npm publish on release tag
- 244 unit tests across 15 test files

## [0.1.0] - 2026-02-23

### Added
- Initial project setup with SRD
