# `cf kv` — Workers KV Key-Value Storage

Manage Cloudflare Workers KV namespaces and globally distributed key-value data with low-latency reads.

---

## Required Permissions

| Action | Scope Level | Minimum API Token Permission |
|--------|-------------|------------------------------|
| Read   | Account     | `Workers KV Storage:Read`    |
| Write  | Account     | `Workers KV Storage:Edit`    |

---

## Subcommands Overview

- [`cf kv namespaces`](#cf-kv-namespaces) — Manage KV namespaces (CRUD)
- [`cf kv list`](#cf-kv-list) — List keys within a namespace
- [`cf kv get`](#cf-kv-get) — Read the value of a key
- [`cf kv put`](#cf-kv-put) — Store a key-value pair
- [`cf kv delete`](#cf-kv-delete) — Remove a key
- [`cf kv bulk-write`](#cf-kv-bulk-write) — Upload up to 10,000 key-value pairs at once
- [`cf kv bulk-delete`](#cf-kv-bulk-delete) — Delete keys in bulk

---

### `cf kv namespaces`

Manage isolated key-value namespaces.

```bash
# List all namespaces
cf kv namespaces list

# Create a new namespace
cf kv namespaces create --title "SESSION_STORE"

# Rename a namespace
cf kv namespaces rename --id <namespace-id> --title "NEW_TITLE"

# Delete a namespace and all its stored keys
cf kv namespaces delete --id <namespace-id> [--yes]
```

---

### `cf kv list`

Lists keys within a specified KV namespace.

#### Syntax
```bash
cf kv list --namespace-id <id> [flags]
```

#### Flags
| Flag | Type | Description |
|------|------|-------------|
| `--namespace-id <id>`| string | *required* KV Namespace ID |
| `--prefix <prefix>` | string | Filter keys starting with a prefix string |
| `--limit <number>` | number | Maximum number of keys to return (default: `1000`) |
| `--cursor <cursor>` | string | Cursor token for iterating through large namespaces |

#### Example
```bash
# List keys matching a prefix
cf kv list --namespace-id 0f2b3e8c9a --prefix "user:"
```

---

### `cf kv get`

Retrieves and prints the raw stored value of a key.

#### Syntax
```bash
cf kv get --namespace-id <id> --key <key-name>
```

#### Example
```bash
cf kv get --namespace-id 0f2b3e8c9a --key "user:123:profile"
```

---

### `cf kv put`

Writes a key-value pair to the namespace, accepting either raw strings or file contents.

#### Syntax
```bash
cf kv put --namespace-id <id> --key <key> (--value <val> | --file <path>) [flags]
```

#### Flags
| Flag | Type | Description |
|------|------|-------------|
| `--namespace-id <id>` | string | *required* Target Namespace ID |
| `--key <name>` | string | *required* Key name |
| `--value <string>` | string | Direct string value to store |
| `--file <path>` | string | Read file contents as the value |
| `--ttl <seconds>` | number | Relative expiration time in seconds (minimum: `60`) |
| `--metadata <json>` | string | JSON metadata object to store alongside the key |

#### Examples
```bash
# Store inline string with a 1-hour expiration
cf kv put --namespace-id 0f2b3e8c9a --key "cache:token" --value "secret123" --ttl 3600

# Store contents of a JSON file
cf kv put --namespace-id 0f2b3e8c9a --key "config:site" --file site-config.json
```

---

### `cf kv delete`

Removes a single key from a namespace.

#### Syntax
```bash
cf kv delete --namespace-id <id> --key <key> [--yes]
```

#### Example
```bash
cf kv delete --namespace-id 0f2b3e8c9a --key "user:123:profile" --yes
```

---

### `cf kv bulk-write` & `cf kv bulk-delete`

Execute high-volume batch operations against KV.

```bash
# Bulk write up to 10,000 keys from a JSON payload
# Payload format: [{"key": "k1", "value": "v1"}, {"key": "k2", "value": "v2", "expiration_ttl": 300}]
cf kv bulk-write --namespace-id 0f2b3e8c9a --file batch.json

# Bulk delete keys from a JSON array of strings
# Payload format: ["k1", "k2", "k3"]
cf kv bulk-delete --namespace-id 0f2b3e8c9a --file keys-to-delete.json --yes
```
