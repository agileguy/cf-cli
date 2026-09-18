# `cf config` — CLI Configuration & Profiles

Manage persistent authentication profiles, default output formats, and environment switching stored in `~/.cf/config.json`.

---

## Subcommands Overview

- [`cf config set`](#cf-config-set) — Create or update an authentication profile
- [`cf config get`](#cf-config-get) — Display stored configuration for a profile
- [`cf config list`](#cf-config-list) — List all saved profiles and indicate active default
- [`cf config use`](#cf-config-use) — Switch the active default profile
- [`cf config delete`](#cf-config-delete) — Remove a profile

---

### `cf config set`

Creates or updates a profile in `~/.cf/config.json`.

#### Syntax
```bash
cf config set --name <profile-name> [credentials & defaults]
```

#### Flags
| Flag | Type | Description |
|------|------|-------------|
| `--name <name>` | string | *required* Profile identifier (letters, digits, and hyphens) |
| `--token <token>` | string | Cloudflare API token |
| `--api-key <key>` | string | Cloudflare Global API Key (requires `--email`) |
| `--email <email>` | string | Account email address |
| `--account-id <id>` | string | Default Account ID for this profile |
| `--zone-id <id>` | string | Default Zone ID for this profile |
| `--output <format>` | string | Preferred output format (`table`, `json`, `csv`, `yaml`) |

#### Examples
```bash
# Set default profile with API token
cf config set --name default --token "cfut_MySecretToken123"

# Create a staging profile with a specific Account ID
cf config set --name staging --token "staging-token" --account-id "023e105f4ecef8ad9ca31a8372d0c353"

# Create profile using legacy global API key
cf config set --name legacy --api-key "global-key-xyz" --email "dev@example.com"
```

---

### `cf config list`

Lists all stored profiles, their authentication methods, and marks which profile is currently default.

#### Syntax
```bash
cf config list
```

#### Example Output
```
┌──────────────────────┬──────────┬────────────────────────────────┬────────────────────────────────────┬─────────┐
│ Profile              │ Auth     │ Email                          │ Account ID                         │ Default │
├──────────────────────┼──────────┼────────────────────────────────┼────────────────────────────────────┼─────────┤
│ default              │ token    │ -                              │ -                                  │ Yes     │
│ staging              │ token    │ -                              │ 023e105f4ecef8ad9ca31a8372d0c353   │         │
└──────────────────────┴──────────┴────────────────────────────────┴────────────────────────────────────┴─────────┘
```

---

### `cf config use`

Switches the active default profile.

#### Syntax
```bash
cf config use --name <profile-name>
```

#### Example
```bash
cf config use --name staging
```

---

### `cf config get`

Inspects stored settings for a specific profile (tokens are masked for security).

#### Syntax
```bash
cf config get --name <profile-name>
```

---

### `cf config delete`

Removes a profile from configuration.

#### Syntax
```bash
cf config delete --name <profile-name> [--yes]
```

#### Example
```bash
cf config delete --name staging --yes
```
