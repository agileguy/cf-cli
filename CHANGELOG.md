# Changelog

## [0.5.0] - 2026-02-23

### Added
- Rulesets: CRUD with dual zone/account scope, rules management, version history, phase entrypoints
- Firewall Legacy: IP access rules, User-Agent rules, zone lockdowns (with IPv6 support)
- Page Shield: settings, scripts, connections, policies management
- Turnstile widgets: CRUD + secret rotation (secrets hidden by default)
- API Gateway: settings + schema management (OpenAPI JSON upload)
- Rate Limits Legacy: CRUD from JSON files
- 177 new unit tests (781 total)

## [0.4.0] - 2026-02-23

### Added
- R2 buckets CRUD + cors, lifecycle, custom-domains, event-notifications, metrics
- D1 databases: list, get, create, update, delete, query (table/json/csv), export, import
- Pages projects CRUD + deployments (list/get/delete/retry/rollback) + domains
- Queues CRUD + consumers management + message sending
- Hyperdrive CRUD with connection string parsing
- Pipelines: list, get, create from JSON config, delete
- Secrets Store: stores CRUD + secrets CRUD
- Shared formatBytes utility
- 238 new unit tests (603 total)

## [0.3.0] - 2026-02-23

### Added
- Workers scripts management: list, get, deploy (multipart upload), delete
- Workers routes CRUD per zone
- Workers cron triggers: get, update
- Workers custom domains management
- Workers versions: list, get
- Workers for Platforms: namespaces, scripts, bindings
- Workers tail: real-time log streaming via WebSocket
- KV namespaces CRUD: list, get, create, rename, delete
- KV key operations: list, get, put (with TTL/metadata), delete, bulk-write, bulk-delete
- Durable Objects: namespace list, objects list
- Account ID auto-resolution utility (flag > config > API auto-detect)
- 121 new unit tests (365 total)

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
