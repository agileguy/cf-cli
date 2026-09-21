# Cloudflare API Token Permissions Matrix

Cloudflare API tokens require explicit permission scopes. If a token lacks a required scope, Cloudflare will reject the request with HTTP 403 or Error `10000: Authentication error`.

Use this matrix to configure minimum least-privilege tokens at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens).

---

## Permission Scope Mapping

### Networking & Domains
| CLI Command Group | Resource Level | Required Scope (Read) | Required Scope (Write) |
|-------------------|----------------|-----------------------|------------------------|
| `cf zones` | Zone | `Zone:Read` | `Zone:Edit` |
| `cf dns` | Zone | `DNS:Read` | `DNS:Edit` |
| `cf lb` | Account | `Load Balancing:Read` | `Load Balancing:Edit` |
| `cf healthchecks` | Account | `Health Checks:Read` | `Health Checks:Edit` |
| `cf spectrum` | Zone | `Spectrum:Read` | `Spectrum:Edit` |
| `cf tunnels` | Account | `Cloudflare Tunnel:Read`| `Cloudflare Tunnel:Edit`|
| `cf registrar` | Account | `Registrar:Read` | `Registrar:Edit` |

### Serverless & Compute
| CLI Command Group | Resource Level | Required Scope (Read) | Required Scope (Write) |
|-------------------|----------------|-----------------------|------------------------|
| `cf workers` | Account | `Workers Scripts:Read` | `Workers Scripts:Edit` |
| `cf workers routes`| Zone | `Workers Routes:Read` | `Workers Routes:Edit` |
| `cf pages` | Account | `Cloudflare Pages:Read`| `Cloudflare Pages:Edit`|
| `cf queues` | Account | `Queues:Read` | `Queues:Edit` |
| `cf snippets` | Zone | `Zone WAF:Read` | `Zone WAF:Edit` |

### Storage & Databases
| CLI Command Group | Resource Level | Required Scope (Read) | Required Scope (Write) |
|-------------------|----------------|-----------------------|------------------------|
| `cf kv` | Account | `Workers KV Storage:Read` | `Workers KV Storage:Edit` |
| `cf r2` | Account | `Workers R2 Storage:Read` | `Workers R2 Storage:Edit` |
| `cf d1` | Account | `D1:Read` | `D1:Edit` |
| `cf hyperdrive` | Account | `Hyperdrive:Read` | `Hyperdrive:Edit` |
| `cf vectorize` | Account | `Vectorize:Read` | `Vectorize:Edit` |
| `cf secrets-store`| Account | `Secrets Store:Read` | `Secrets Store:Edit` |

### Security & Zero Trust
| CLI Command Group | Resource Level | Required Scope (Read) | Required Scope (Write) |
|-------------------|----------------|-----------------------|------------------------|
| `cf access` | Account | `Access: Apps and Policies:Read` | `Access: Apps and Policies:Edit` |
| `cf gateway` | Account | `Zero Trust:Read` | `Zero Trust:Edit` |
| `cf firewall` | Zone | `Zone Settings:Read` | `Zone Settings:Edit` |
| `cf rulesets` | Account / Zone | `Rulesets:Read` | `Rulesets:Edit` |
| `cf turnstile` | Account | `Turnstile:Read` | `Turnstile:Edit` |
| `cf ssl` | Zone | `SSL and Certificates:Read` | `SSL and Certificates:Edit` |
| `cf page-shield` | Zone | `Page Shield:Read` | `Page Shield:Edit` |

### Performance & Cache
| CLI Command Group | Resource Level | Required Scope (Read) | Required Scope (Write) |
|-------------------|----------------|-----------------------|------------------------|
| `cf cache` | Zone | N/A | `Zone:Purge` (or `Zone:Edit`)|
| `cf argo` | Zone | `Zone Settings:Read` | `Zone Settings:Edit` |
| `cf observatory` | Zone | `Analytics:Read` | `Analytics:Edit` |
| `cf waiting-rooms`| Zone | `Waiting Room:Read` | `Waiting Room:Edit` |

---

## Recommended Token Presets

### 1. "CI/CD Deployment" Token
* **Permissions:**
  * `Account: Workers Scripts:Edit`
  * `Account: Cloudflare Pages:Edit`
  * `Zone: Purge:Purge`
* **Resource:** Specific Zone & Account

### 2. "DNS Automation" Token
* **Permissions:**
  * `Zone: DNS:Edit`
  * `Zone: Zone:Read`
* **Resource:** Specific Zone

### 3. "Auditor / Read-Only" Token
* **Permissions:**
  * `Zone: Zone:Read`
  * `Account: Audit Logs:Read`
  * `Account: Account Settings:Read`
* **Resource:** All Accounts and Zones
