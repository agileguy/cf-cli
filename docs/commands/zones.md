# `cf zones` — Zones Management

Manage Cloudflare domain zones, inspect zone details, configure zone settings, and retrieve analytics dashboards.

---

## Required Permissions

| Action | Minimum Cloudflare API Token Scope |
|--------|-----------------------------------|
| Read   | `Zone.Zone:Read`                  |
| Edit   | `Zone.Zone:Edit`                  |
| Settings Edit | `Zone.Zone Settings:Edit`  |
| Analytics | `Zone.Analytics:Read`          |

---

## Subcommands Overview

- [`cf zones list`](#cf-zones-list) — List all zones in account
- [`cf zones get`](#cf-zones-get) — Get detailed zone metadata
- [`cf zones create`](#cf-zones-create) — Register a new zone
- [`cf zones delete`](#cf-zones-delete) — Delete a zone
- [`cf zones settings`](#cf-zones-settings) — Inspect and update zone settings
- [`cf zones analytics`](#cf-zones-analytics) — View dashboard, colocation, and DNS traffic analytics

---

### `cf zones list`

Lists all domain zones accessible by the active profile.

#### Syntax
```bash
cf zones list [flags]
```

#### Flags
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--account-id <id>` | string | auto-detected | Filter zones by Account ID |
| `--name <domain>` | string | | Filter zones matching domain name |
| `--status <status>` | string | | Filter by status (`active`, `pending`, `initializing`, `moved`, `deleted`) |
| `--page <num>` | number | `1` | Page number for pagination |
| `--per-page <num>` | number | `20` | Number of results per page |
| `--all` | boolean | `false` | Fetch all zones across all pages automatically |

#### Examples
```bash
# List all zones in table format
cf zones list

# Find active zones matching a domain prefix
cf zones list --name example.com --status active

# Fetch all zones and export to CSV
cf zones list --all --output csv > zones.csv
```

---

### `cf zones get`

Displays comprehensive details for a specific zone.

#### Syntax
```bash
cf zones get --zone <zone-id-or-name>
```

#### Flags
| Flag | Type | Required | Description |
|------|------|----------|-------------|
| `--zone <id-or-name>` | string | Yes | Zone ID or domain name (e.g. `example.com`) |

#### Examples
```bash
cf zones get --zone example.com
cf zones get --zone 023e105f4ecef8ad9ca31a8372d0c353
```

---

### `cf zones create`

Creates a new domain zone within an account.

#### Syntax
```bash
cf zones create --name <domain> [--account-id <id>] [--type <type>] [--jump-start]
```

#### Flags
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--name <domain>` | string | *required* | Apex domain name (e.g., `example.com`) |
| `--account-id <id>`| string | auto-detected | Account ID where the zone will reside |
| `--type <type>` | string | `full` | Zone setup type: `full` (Cloudflare NS) or `partial` (CNAME setup) |
| `--jump-start` | boolean | `false` | Automatically scan and import existing DNS records |

#### Example
```bash
cf zones create --name example.com --jump-start
```

---

### `cf zones delete`

Deletes a zone from your Cloudflare account.

#### Syntax
```bash
cf zones delete --zone <zone-id-or-name> [--yes]
```

#### Flags
| Flag | Type | Description |
|------|------|-------------|
| `--zone <id-or-name>` | string | Zone ID or domain name to delete |
| `--yes` | boolean | Bypass interactive deletion confirmation prompt |

#### Example
```bash
cf zones delete --zone example.com --yes
```

---

### `cf zones settings`

Manage TLS, security, and caching settings for a zone.

```bash
# List all settings and their current status
cf zones settings list --zone example.com

# Inspect a single setting (e.g., ssl, always_use_https, min_tls_version)
cf zones settings get --zone example.com --setting ssl

# Update a setting value
cf zones settings update --zone example.com --setting always_use_https --value on
cf zones settings update --zone example.com --setting min_tls_version --value "1.3"
```

---

### `cf zones analytics`

Retrieve traffic, performance, and threat metrics.

```bash
# General traffic and request dashboard
cf zones analytics dashboard --zone example.com --from 2024-01-01 --to 2024-01-31

# Edge colocation datacenter analytics
cf zones analytics colo --zone example.com

# DNS query traffic metrics
cf zones analytics dns --zone example.com
```
