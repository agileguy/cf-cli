# `cf dns` — DNS Records Management

Manage DNS records for your Cloudflare zones, including record creation, bulk queries, proxy toggling, and BIND zone file import/export.

---

## Required Permissions

| Action | Minimum Cloudflare API Token Scope |
|--------|-----------------------------------|
| Read   | `Zone.DNS:Read`                   |
| Write  | `Zone.DNS:Edit`                   |

---

## Subcommands Overview

- [`cf dns list`](#cf-dns-list) — List DNS records with optional filtering
- [`cf dns get`](#cf-dns-get) — Retrieve specific DNS record details
- [`cf dns create`](#cf-dns-create) — Add a new DNS record
- [`cf dns update`](#cf-dns-update) — Full update of an existing record (PUT)
- [`cf dns patch`](#cf-dns-patch) — Partial update of specific fields (PATCH)
- [`cf dns delete`](#cf-dns-delete) — Remove a DNS record
- [`cf dns import`](#cf-dns-import) — Import records from a standard BIND zone file
- [`cf dns export`](#cf-dns-export) — Export zone records in BIND zone file format

---

### `cf dns list`

Lists all DNS records for a given zone.

#### Syntax
```bash
cf dns list --zone <zone-id-or-name> [flags]
```

#### Flags
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--zone <id-or-name>` | string | *required* | Target Zone ID or domain name |
| `--type <type>` | string | | Filter by DNS type (`A`, `AAAA`, `CNAME`, `TXT`, `MX`, etc.) |
| `--name <name>` | string | | Filter by exact record hostname |
| `--content <content>` | string | | Filter by IP address or record content |
| `--page <num>` | number | `1` | Page number |
| `--per-page <num>` | number | `20` | Results per page |
| `--all` | boolean | `false` | Fetch all records across all pages |

#### Examples
```bash
# List all records for a zone
cf dns list --zone example.com

# Filter to show only MX records
cf dns list --zone example.com --type MX

# Find all records pointing to a specific origin server IP
cf dns list --zone example.com --content 198.51.100.1
```

---

### `cf dns get`

Retrieve full details for a single DNS record by its ID.

#### Syntax
```bash
cf dns get --zone <zone-id-or-name> --id <record-id>
```

#### Example
```bash
cf dns get --zone example.com --id 372e67954025e0ba6aaa6d586b9e0b59
```

---

### `cf dns create`

Creates a new DNS record in your zone.

#### Syntax
```bash
cf dns create --zone <zone> --type <type> --name <name> --content <content> [flags]
```

#### Flags
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--zone <id-or-name>` | string | *required* | Zone ID or domain name |
| `--type <type>` | string | *required* | Record type (`A`, `AAAA`, `CNAME`, `TXT`, `MX`, `SRV`, etc.) |
| `--name <name>` | string | *required* | Subdomain or `@` for root domain |
| `--content <content>` | string | *required* | Target IP, hostname, or text value |
| `--ttl <seconds>` | number | `1` | Time To Live in seconds (`1` for Automatic) |
| `--proxied` | boolean | `false` | Enable Cloudflare proxy (CDN, DDoS protection, WAF) |
| `--priority <num>` | number | | Priority for `MX` and `SRV` records |
| `--comment <text>` | string | | Optional administrative comment |

#### Examples
```bash
# Create a proxied root A record
cf dns create --zone example.com --type A --name @ --content 203.0.113.195 --proxied

# Create an unproxied CNAME with 300s TTL
cf dns create --zone example.com --type CNAME --name mail --content mail.provider.net --ttl 300

# Create an MX record with priority 10
cf dns create --zone example.com --type MX --name @ --content mail.example.com --priority 10
```

---

### `cf dns patch`

Partially updates an existing DNS record without needing to re-specify all original fields.

#### Syntax
```bash
cf dns patch --zone <zone> --id <record-id> [fields...]
```

#### Flags
| Flag | Type | Description |
|------|------|-------------|
| `--zone <id-or-name>` | string | *required* Zone ID or domain name |
| `--id <record-id>` | string | *required* Target record ID |
| `--content <content>` | string | New record target IP or value |
| `--proxied` | boolean | Update proxy status (`--proxied` or `--no-proxied`) |
| `--ttl <seconds>` | number | Update TTL in seconds |
| `--comment <text>` | string | Update comment |

#### Example
```bash
# Toggle proxy status without changing the IP
cf dns patch --zone example.com --id <record-id> --proxied

# Update the target IP only
cf dns patch --zone example.com --id <record-id> --content 198.51.100.20
```

---

### `cf dns delete`

Removes a DNS record.

#### Syntax
```bash
cf dns delete --zone <zone> --id <record-id> [--yes]
```

#### Example
```bash
cf dns delete --zone example.com --id 372e67954025e0ba6aaa6d586b9e0b59 --yes
```

---

### `cf dns import` & `cf dns export`

Backup and migrate DNS configurations using standard BIND format files.

```bash
# Export all records to standard BIND zone file format
cf dns export --zone example.com > example.com.zone

# Import records from a BIND zone file (with optional proxy toggle)
cf dns import --zone example.com --file example.com.zone [--proxied]
```
