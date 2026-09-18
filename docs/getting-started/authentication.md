# Authentication & Profile Management

`cf` provides flexible authentication suited for both interactive development and headless CI/CD pipelines.

---

## 1. Authentication Methods

### Method A: API Token (Recommended)
Cloudflare API tokens provide scoped, fine-grained access with configurable expiration dates.

Set the token via environment variable:
```bash
export CF_API_TOKEN="your-cloudflare-api-token"
```

*(Note: `CLOUDFLARE_API_TOKEN` is also supported as an alias)*.

### Method B: Global API Key & Account Email (Legacy)
If you require legacy authentication using your Cloudflare account email and Global API Key:

```bash
export CF_API_KEY="your-global-api-key"
export CF_API_EMAIL="you@example.com"
```

> **Security Warning:** Global API keys grant full administrative privileges across all zones and accounts. Creating an API Token with least-privilege permissions is strongly recommended.

---

## 2. Config Profiles (Persistent Credentials)

`cf` allows storing multiple named authentication profiles in `~/.cf/config.json`. This makes switching between multiple accounts, clients, or environments seamless.

### Creating Profiles
```bash
# Add a default profile with an API Token
cf config set --name default --token "cfut_..."

# Add a staging profile with an explicit account ID
cf config set --name staging --token "staging-token" --account-id "023e105f4ecef8ad9ca31a8372d0c353"

# Add a legacy key profile
cf config set --name legacy --key "global-key" --email "admin@example.com"
```

### Listing Profiles
```bash
cf config list
```

Example Output:
```
┌──────────────────────┬──────────┬────────────────────────────────┬────────────────────────────────────┬─────────┐
│ Profile              │ Auth     │ Email                          │ Account ID                         │ Default │
├──────────────────────┼──────────┼────────────────────────────────┼────────────────────────────────────┼─────────┤
│ default              │ token    │ -                              │ -                                  │ Yes     │
│ staging              │ token    │ -                              │ 023e105f4ecef8ad9ca31a8372d0c353   │         │
│ legacy               │ key      │ admin@example.com              │ -                                  │         │
└──────────────────────┴──────────┴────────────────────────────────┴────────────────────────────────────┴─────────┘
```

### Switching Default Profile
```bash
cf config use --name staging
```

### Using Profiles on a Per-Command Basis
Override the active profile for a single invocation:
```bash
cf zones list --profile staging
```

---

## 3. Resolution Precedence

When running any command, `cf` resolves credentials in this strict order:

1. `--profile <name>` CLI flag
2. `CF_PROFILE` environment variable
3. `CF_API_TOKEN` (or `CLOUDFLARE_API_TOKEN`) environment variable
4. `CF_API_KEY` + `CF_API_EMAIL` environment variables
5. `default` profile from `~/.cf/config.json`
6. If none are found, the command exits with an authentication error

---

## 4. Verifying Credentials

To verify your credentials and check token validity:

```bash
# Verify current API token status
cf user tokens verify

# Inspect current user identity
cf user get
```
