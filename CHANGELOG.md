# Changelog

## [1.1.0] - 2026-02-24

### Added
- Email Routing: settings get/enable/disable, DNS, addresses CRUD, rules CRUD, catch-all
- Alerts & Notifications: policies CRUD, webhooks, PagerDuty, silences, history, available alerts
- Rules Lists: lists CRUD, items (add/replace/delete with cursor pagination)
- Snippets: CRUD with multipart upload, rules list/upsert
- Registrar: domain list, get, update (auto-renew/locked/privacy), transfer-in
- Account Members & Roles: members CRUD (add/update/remove), roles list/get
- Account Subscriptions & Billing: subscriptions list/get, billing profile/history
- Audit Logs: list with filters (email, action, resource, date range, direction)
- User Tokens: full lifecycle (list, get, create, update, delete, verify, roll)
- Page Rules (legacy): CRUD from JSON files
- Zone Analytics: dashboard, colo, DNS analytics with date ranges
- Zone Settings: list all, get individual, update with JSON or string values
- 206 new unit tests (2146 total)

## [1.0.0] - 2026-02-24

### Added
- Radar: locations, datasets, AS, attacks, BGP, bots, DNS, email, HTTP, annotations
- Intel: ASN, domain, IP, WHOIS, DNS, IP lists, attack surface
- URL Scanner: scan, search, get, HAR, DOM, screenshot, bulk scanning
- Cloudforce One: requests CRUD, PIRs, scans, threat events
- Logpush: dual zone/account scope, jobs CRUD (enable/disable), datasets, instant logs, ownership
- Web Analytics: sites CRUD, rules CRUD
- Zaraz: config get/update, export, publish, workflow, history
- 225 new unit tests (1940 total)

## [0.9.0] - 2026-02-24

### Added
- Magic Transit: GRE tunnels, IPsec tunnels (+ PSK generation), sites (LANs/WANs), routes, ACLs, PCAPs (+ download)
- Magic Network Monitoring: config get/update, rules CRUD
- Addressing: address maps CRUD, prefixes (+ BGP/delegations), regional hostnames (zone-scoped with get)
- Spectrum: apps CRUD, analytics (summary + bytes)
- 207 new unit tests (1715 total)

## [0.8.0] - 2026-02-24

### Added
- Stream: videos CRUD, live inputs, captions, audio tracks, signing keys, watermarks, webhooks
- Images: CRUD, variants, signing keys, direct upload, stats
- Calls/WebRTC: apps CRUD, TURN keys management
- Workers AI: inference run, models list/get, fine-tuning CRUD
- AI Gateway: CRUD, logs, datasets, evaluations
- Vectorize: index CRUD, insert/upsert/query, vectors get/delete, metadata indexes
- 263 new unit tests (1508 total)

## [0.7.0] - 2026-02-23

### Added
- SSL: analyze, universal, advanced, custom certs, client certs, keyless, origin CA, mTLS, verification, DCV delegation, recommendations, post-quantum
- Load Balancers: CRUD + pools (preview/health) + monitors (preview/references) + regions
- Healthchecks: CRUD + preview
- Cache Settings: cache-reserve, tiered-cache, argo smart routing
- Waiting Rooms: CRUD + status + events CRUD + rules upsert
- Observatory: pages list, speed tests CRUD, schedules CRUD
- 251 new unit tests (1245 total)

## [0.6.0] - 2026-02-23

### Added
- Access: apps (zone/account dual scope), policies, service-tokens, groups, users/sessions, certificates, identity providers
- Gateway: DNS policies, HTTP policies, network policies, DLP profiles
- Tunnels: CRUD, token retrieval, config management, connection management
- Devices: list, get, revoke, registrations, posture rules CRUD
- WARP: settings, split-tunnels (with duplicate guard), fleet-status
- 213 new unit tests (994 total)

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
