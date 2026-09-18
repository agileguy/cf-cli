# `cf workers` — Serverless Workers Management

Manage Cloudflare Workers scripts, deploy edge functions, configure routing patterns, schedule cron triggers, attach custom domains, inspect deployment versions, and tail live execution logs.

---

## Required Permissions

| Action | Scope Level | Minimum API Token Permission |
|--------|-------------|------------------------------|
| Scripts CRUD | Account | `Workers Scripts:Edit` (or `Read`) |
| Routes CRUD | Zone | `Workers Routes:Edit` (or `Read`) |
| Tail Logs | Account | `Workers Tail:Read` |
| Custom Domains | Account | `Workers Custom Domains:Edit` |

---

## Subcommands Overview

- [`cf workers list`](#cf-workers-list) — List all worker scripts in an account
- [`cf workers get`](#cf-workers-get) — Get worker details, bindings, and metadata
- [`cf workers deploy`](#cf-workers-deploy) — Upload and deploy a JavaScript/Wasm script
- [`cf workers delete`](#cf-workers-delete) — Delete a worker script
- [`cf workers tail`](#cf-workers-tail) — Stream live console and execution logs in real-time
- [`cf workers routes`](#cf-workers-routes) — Map workers to URL route patterns on zones
- [`cf workers cron`](#cf-workers-cron) — Manage scheduled cron triggers
- [`cf workers domains`](#cf-workers-domains) — Attach custom domains directly to workers
- [`cf workers versions`](#cf-workers-versions) — Inspect immutable script deployment versions
- [`cf workers platforms`](#cf-workers-platforms) — Manage Workers for Platforms dispatch namespaces

---

### `cf workers list`

Lists all Worker scripts in your account.

#### Syntax
```bash
cf workers list [--account-id <id>]
```

#### Example
```bash
cf workers list
```

---

### `cf workers deploy`

Uploads and deploys a script bundle to the Cloudflare edge.

#### Syntax
```bash
cf workers deploy --name <script-name> --file <path-to-bundle> [flags]
```

#### Flags
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--name <name>` | string | *required* | Unique name for the Worker service |
| `--file <path>` | string | *required* | Path to JavaScript or bundle file (`.js`, `.mjs`) |
| `--compatibility-date <date>` | string | current | Compatibility date (`YYYY-MM-DD`) |
| `--account-id <id>` | string | auto-detected | Target Account ID |

#### Example
```bash
cf workers deploy --name auth-edge --file dist/worker.js --compatibility-date 2024-01-01
```

---

### `cf workers tail`

Opens a persistent WebSocket stream to tail worker invocation logs, `console.log` statements, and unhandled exceptions in real-time.

#### Syntax
```bash
cf workers tail --name <script-name> [flags]
```

#### Flags
| Flag | Type | Description |
|------|------|-------------|
| `--name <name>` | string | *required* Name of the worker script |
| `--status <status>` | string | Filter logs by execution status (`ok`, `error`, `canceled`) |
| `--method <method>` | string | Filter logs by HTTP method (`GET`, `POST`, etc.) |
| `--sampling-rate <num>`| number | Float between `0` and `1` (e.g. `0.1` for 10% sampling) |

#### Example
```bash
# Stream all error logs in real-time
cf workers tail --name auth-edge --status error
```

---

### `cf workers routes`

Binds a worker script to execute on specific HTTP request paths on a zone.

```bash
# List all route bindings for a zone
cf workers routes list --zone example.com

# Create a route pattern binding
cf workers routes create --zone example.com --pattern "api.example.com/*" --script auth-edge

# Delete a route binding
cf workers routes delete --zone example.com --id <route-id> --yes
```

---

### `cf workers cron`

Configure scheduled cron triggers without modifying script code.

```bash
# View active cron schedule
cf workers cron get --name auth-edge

# Set scheduled execution (e.g. every 5 minutes)
cf workers cron update --name auth-edge --cron "*/5 * * * *"
```

---

### `cf workers domains`

Attach custom hostnames directly to a Worker without needing manual DNS records or route bindings.

```bash
# List custom domains
cf workers domains list

# Attach a domain to a worker
cf workers domains create --name auth-edge --zone example.com --hostname auth.example.com

# Detach a custom domain
cf workers domains delete --id <domain-id> --yes
```
