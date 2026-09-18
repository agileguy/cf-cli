# Cloudflare CLI (`cf`) Documentation

Welcome to the comprehensive documentation for **`@agileguy/cf-cli`** (`cf`), a zero-dependency, fully featured CLI wrapping the entire Cloudflare REST API.

---

## Quick Navigation

### Getting Started
* [Installation](getting-started/installation.md) - npm, bun, source build, and shell completions
* [Authentication](getting-started/authentication.md) - API Tokens, Global Keys, Profiles, and resolution precedence
* [Output Formats & Scripting](getting-started/output-formats.md) - Table, JSON, CSV, YAML, `--raw`, and `jq` automation

### Guides & Best Practices
* [Cloudflare API Token Permissions Matrix](guides/permissions-matrix.md) - Exact API token permission scopes required per command
* [CI/CD & Automation Guide](guides/ci-cd-automation.md) - GitHub Actions & GitLab CI workflows, automation recipes, and exit codes

### Core Command References
* [Zones & Settings](commands/zones.md) - Zone CRUD, settings management, and traffic analytics
* [DNS Records](commands/dns.md) - Record CRUD, BIND import/export, and proxy toggling
* [Workers & Serverless](commands/workers.md) - Scripts, routes, cron triggers, custom domains, versions, and live log tailing
* [Workers KV](commands/kv.md) - Key-value namespaces, keys, and bulk operations
* [R2 Object Storage](commands/r2.md) - Buckets, objects, CORS, lifecycle rules, and custom domains
* [D1 SQL Databases](commands/d1.md) - Databases, SQL query execution, and database import/export
* [Pages](commands/pages.md) - Pages projects, deployments, and domain mapping
* [Cloudflare Tunnels](commands/tunnels.md) - Zero Trust tunnels, route ingress, and credentials
* [Rulesets & WAF](commands/rulesets.md) - Phase-based rulesets, WAF rules, and custom expressions
* [CLI Configuration](commands/config.md) - Managing authentication profiles and global defaults

---

## CLI Overview & Global Flags

The `cf` CLI follows a standard syntax:

```bash
cf <resource> <action> [flags]
```

### Global Flags

Every command supports the following global flags:

| Flag | Type | Description |
|------|------|-------------|
| `--profile <name>` | `string` | Use a specific profile configured in `~/.cf/config.json` |
| `--output <format>` | `string` | Output format: `table` (default), `json`, `csv`, `yaml` |
| `--raw` | `boolean` | Print raw, unformatted API JSON response |
| `--verbose` | `boolean` | Print HTTP request URLs, methods, headers, and timing |
| `--quiet` | `boolean` | Suppress non-essential informational and progress messages |
| `--no-color` | `boolean` | Disable colored terminal output (also respects `NO_COLOR=1`) |
| `--yes` | `boolean` | Automatically confirm destructive actions (e.g., delete) |
| `--help`, `-h` | `boolean` | Show command syntax and help |
| `--version`, `-v` | `boolean` | Show current CLI version |

---

## Complete Resource Catalog (60 Resources)

| Resource | CLI Name | Description | Category |
|----------|----------|-------------|----------|
| **Zones** | `zones`, `zone` | Manage domain zones, settings, and analytics | Networking |
| **DNS** | `dns` | Manage DNS records, BIND import and export | Networking |
| **Workers** | `workers`, `worker` | Manage Workers scripts, routes, cron, domains, tail | Compute |
| **KV** | `kv` | Manage Workers KV namespaces and key-value pairs | Storage |
| **Durable Objects** | `durable-objects` | Inspect namespaces and active Durable Objects | Compute |
| **R2** | `r2` | S3-compatible object storage buckets and files | Storage |
| **D1** | `d1` | Serverless SQL database creation, querying, import/export | Storage |
| **Pages** | `pages` | JAMstack projects, preview/production deployments | Compute |
| **Queues** | `queues` | Message queues, producers, and consumers | Compute |
| **Hyperdrive** | `hyperdrive` | Accelerated database connection pooling | Storage |
| **Pipelines** | `pipelines` | High-throughput data ingestion pipelines | Storage |
| **Secrets Store** | `secrets-store` | Encrypted secrets management | Security |
| **Rulesets** | `rulesets` | Modern WAF rules, transformation rules, HTTP phases | Security |
| **Firewall** | `firewall` | Legacy firewall rules, IP access, zone lockdowns | Security |
| **Page Shield** | `page-shield` | Client-side security, script monitoring, CSP policies | Security |
| **Turnstile** | `turnstile` | CAPTCHA alternative site keys and verification widgets | Security |
| **API Gateway** | `api-gateway` | Schema validation, endpoint discovery, settings | Security |
| **Rate Limits** | `rate-limits` | Legacy rate limiting configuration | Security |
| **Tunnels** | `tunnels` | Cloudflare Tunnel (cloudflared) connections and routing | Zero Trust |
| **Devices** | `devices` | Zero Trust device enrollment and posture policies | Zero Trust |
| **WARP** | `warp` | Cloudflare WARP client settings and split tunnels | Zero Trust |
| **Access** | `access` | Zero Trust access apps, policies, IdPs, service tokens | Zero Trust |
| **Gateway** | `gateway` | Secure web gateway, DNS/HTTP filtering, DLP | Zero Trust |
| **Accounts** | `accounts` | Account details, members, roles, subscriptions | Account |
| **User** | `user` | User profile, billing history, and API tokens | Account |
| **SSL/TLS** | `ssl` | Universal SSL, edge certificates, custom certificates | Security |
| **Load Balancers** | `lb` | Global load balancing, health monitors, pools | Networking |
| **Healthchecks** | `healthchecks` | Standalone origin healthchecks | Networking |
| **Cache Reserve** | `cache-reserve` | Persistent R2-backed cache settings | Performance |
| **Tiered Cache** | `tiered-cache` | Smart topology tiered cache settings | Performance |
| **Argo** | `argo` | Smart routing and tiered caching optimization | Performance |
| **Waiting Rooms** | `waiting-rooms` | Virtual waiting rooms for high-traffic surges | Performance |
| **Observatory** | `observatory` | Speed tests, Core Web Vitals, performance audit | Performance |
| **Stream** | `stream` | Video upload, live streaming, watermarks, captions | Media |
| **Images** | `images` | Image optimization, variants, direct creator uploads | Media |
| **Calls** | `calls` | WebRTC audio/video infrastructure and TURN keys | Media |
| **AI** | `ai` | Workers AI inference, model catalog, fine-tuning | AI |
| **AI Gateway** | `ai-gateway` | AI caching, analytics, rate limiting, evaluations | AI |
| **Vectorize** | `vectorize` | Vector database for embeddings and RAG search | AI |
| **Magic Transit** | `magic-transit` | BGP, IPsec/GRE tunnels, ACLs, packet captures | Network Ops |
| **MNM** | `mnm` | Magic Network Monitoring and alert rules | Network Ops |
| **Addressing** | `addressing` | Bring Your Own IP (BYOIP), prefixes, address maps | Network Ops |
| **Spectrum** | `spectrum` | TCP/UDP proxying and DDoS protection | Networking |
| **Radar** | `radar` | Global Internet traffic insights, BGP, attacks | Intelligence |
| **Intel** | `intel` | Threat intelligence: IP, ASN, domain, WHOIS lookup | Intelligence |
| **URL Scanner** | `url-scanner` | Page scan, HAR capture, screenshot, DOM inspection | Intelligence |
| **Cloudforce One** | `cf1` | Threat intel requests, threat events, PIRs | Intelligence |
| **Logpush** | `logpush` | Real-time log streaming to S3, BigQuery, Datadog | Observability |
| **Web Analytics** | `web-analytics` | Privacy-first Web Analytics (RUM) | Observability |
| **Zaraz** | `zaraz` | Third-party script manager and consent management | Performance |
| **Email Routing** | `email-routing` | Custom domain email routing, addresses, rules | Communication |
| **Alerts** | `alerts` | Notification policies, Webhooks, PagerDuty | Observability |
| **Rules Lists** | `rules-lists` | Reusable IP and hostname lists for firewall/rules | Security |
| **Snippets** | `snippets` | Lightweight JavaScript edge snippets | Compute |
| **Registrar** | `registrar` | Domain registration, renewals, and transfer-in | Domains |
| **Audit Logs** | `audit-logs` | Account audit log history | Observability |
| **Page Rules** | `page-rules` | Legacy URL forwarding and caching rules | Performance |
| **Cache** | `cache` | Cache purging (everything, tags, hosts, prefixes) | Performance |
| **Config** | `config` | CLI profiles, tokens, default formats | CLI |
| **Completion** | `completion` | Shell completion scripts (Bash, Zsh, Fish) | CLI |
