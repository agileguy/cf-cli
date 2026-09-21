# `cf tunnels` — Cloudflare Zero Trust Tunnels

Manage Cloudflare Tunnels (`cloudflared`) to securely expose origin servers, private network services, and local development environments without opening public inbound ports.

---

## Required Permissions

| Action | Scope Level | Minimum API Token Permission |
|--------|-------------|------------------------------|
| Read   | Account     | `Cloudflare Tunnel:Read`     |
| Write  | Account     | `Cloudflare Tunnel:Edit`     |

---

## Subcommands Overview

- [`cf tunnels list`](#cf-tunnels-list) — List all tunnels in your account
- [`cf tunnels get`](#cf-tunnels-get) — Get tunnel status and connection health
- [`cf tunnels create`](#cf-tunnels-create) — Provision a new tunnel
- [`cf tunnels delete`](#cf-tunnels-delete) — Remove an inactive tunnel
- [`cf tunnels token`](#cf-tunnels-token) — Retrieve the base64 authentication token for `cloudflared`
- [`cf tunnels config`](#cf-tunnels-config) — Manage remotely managed ingress routing rules
- [`cf tunnels connections`](#cf-tunnels-connections) — View active connector edge links

---

### `cf tunnels list`

Lists all tunnels and their status (`healthy`, `down`, `inactive`).

#### Syntax
```bash
cf tunnels list [--is-deleted]
```

---

### `cf tunnels create`

Provisions a new remotely managed Cloudflare Tunnel.

#### Syntax
```bash
cf tunnels create --name <tunnel-name>
```

#### Example
```bash
cf tunnels create --name internal-k8s-cluster
```

---

### `cf tunnels token`

Retrieves the secret authentication token used to run the `cloudflared` daemon in Docker, Kubernetes, or systemd.

#### Syntax
```bash
cf tunnels token --id <tunnel-id>
```

#### Example
```bash
# Run tunnel immediately using Docker
# This command already prints the bare token on stdout; no format flag is needed
TOKEN=$(cf tunnels token --id 7b29a1b0-2345-4b3e-9087-123456abcdef)
docker run -d cloudflare/cloudflared:latest tunnel --no-autoupdate run --token "$TOKEN"
```

---

### `cf tunnels config`

Manage remotely managed tunnel configurations and ingress rules without editing local YAML files.

```bash
# View active ingress rules
cf tunnels config get --id <tunnel-id>

# Apply ingress configuration from a JSON file
cf tunnels config update --id <tunnel-id> --file ingress.json
```

*Example `ingress.json`:*
```json
{
  "config": {
    "ingress": [
      {
        "hostname": "grafana.internal.example.com",
        "service": "http://localhost:3000"
      },
      {
        "service": "http_status:404"
      }
    ]
  }
}
```

---

### `cf tunnels connections`

Inspect active connections between your `cloudflared` instance and Cloudflare edge data centers.

```bash
cf tunnels connections --id <tunnel-id>
```

---

### `cf tunnels delete`

Deletes a tunnel and cleans up its credentials.

#### Syntax
```bash
cf tunnels delete --id <tunnel-id> [--yes]
```

#### Example
```bash
cf tunnels delete --id 7b29a1b0-2345-4b3e-9087-123456abcdef --yes
```
