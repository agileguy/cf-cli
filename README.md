# @agileguy/cf-cli

A fully-featured Cloudflare CLI wrapping the entire Cloudflare REST API. Zero dependencies, single binary, 50+ resource groups, 2100+ tests.

## Installation

```bash
# npm
npm install -g @agileguy/cf-cli

# bun
bun install -g @agileguy/cf-cli
```

After installation the `cf` command is available globally.

## Authentication

Set up credentials using environment variables or config profiles.

### Environment Variables (quickest)

```bash
# API Token (recommended)
export CF_API_TOKEN="your-api-token"

# Or Global API Key + Email
export CF_API_KEY="your-global-api-key"
export CF_API_EMAIL="you@example.com"
```

### Config Profiles (persistent)

```bash
# Create a profile
cf config set --name default --token your-api-token

# Create additional profiles
cf config set --name staging --token staging-token

# Switch default profile
cf config use --name staging

# Use a profile for a single command
cf zones list --profile staging
```

### Resolution Order

1. `--profile` flag
2. `CF_PROFILE` environment variable
3. `CF_API_TOKEN` environment variable
4. `CF_API_KEY` + `CF_API_EMAIL` environment variables
5. `default` profile from config file

## Global Flags

| Flag | Description |
|------|-------------|
| `--profile <name>` | Use a specific auth profile |
| `--output <format>` | Output format: `table`, `json`, `csv`, `yaml` (default: `table`) |
| `--raw` | Show raw API response JSON |
| `--verbose` | Show debug output (HTTP requests, timing) |
| `--quiet` | Suppress non-essential output |
| `--no-color` | Disable colored output (also respects `NO_COLOR` env) |
| `--yes` | Auto-confirm destructive operations |
| `--help` | Show help |
| `--version` | Show version |

## Commands

### Zones

```bash
cf zones list
cf zones get --zone example.com
cf zones create --name example.com
cf zones delete --zone example.com [--yes]

# Zone Settings
cf zones settings list --zone example.com
cf zones settings get --zone example.com --setting ssl
cf zones settings update --zone example.com --setting always_use_https --value on

# Zone Analytics
cf zones analytics dashboard --zone example.com [--from 2024-01-01] [--to 2024-01-31]
cf zones analytics colo --zone example.com
cf zones analytics dns --zone example.com
```

### DNS

```bash
cf dns list --zone example.com
cf dns get --zone example.com --id <record-id>
cf dns create --zone example.com --type A --name www --content 1.2.3.4 [--proxied] [--ttl 300]
cf dns update --zone example.com --id <id> --type A --name www --content 5.6.7.8
cf dns patch --zone example.com --id <id> --content 5.6.7.8
cf dns delete --zone example.com --id <id> [--yes]
cf dns export --zone example.com
cf dns import --zone example.com --file records.bind
```

### Workers

```bash
# Scripts
cf workers list
cf workers get --name my-worker
cf workers deploy --name my-worker --file worker.js
cf workers delete --name my-worker [--yes]

# Routes
cf workers routes list --zone example.com
cf workers routes create --zone example.com --pattern "example.com/*" --script my-worker
cf workers routes delete --zone example.com --id <route-id> [--yes]

# Cron Triggers
cf workers cron get --name my-worker
cf workers cron update --name my-worker --cron "*/5 * * * *"

# Custom Domains
cf workers domains list
cf workers domains create --name my-worker --zone example.com --hostname api.example.com
cf workers domains delete --id <domain-id> [--yes]

# Versions
cf workers versions list --name my-worker
cf workers versions get --name my-worker --id <version-id>

# Workers for Platforms
cf workers platforms namespaces list
cf workers platforms namespaces create --name my-ns
cf workers platforms scripts list --namespace <ns-id>

# Tail (real-time logs)
cf workers tail --name my-worker
```

### KV (Workers KV)

```bash
# Namespaces
cf kv namespaces list
cf kv namespaces create --title MY_KV
cf kv namespaces rename --id <ns-id> --title NEW_NAME
cf kv namespaces delete --id <ns-id> [--yes]

# Keys
cf kv list --namespace <ns-id>
cf kv get --namespace <ns-id> --key my-key
cf kv put --namespace <ns-id> --key my-key --value "hello" [--ttl 3600]
cf kv delete --namespace <ns-id> --key my-key [--yes]
cf kv bulk-write --namespace <ns-id> --file entries.json
cf kv bulk-delete --namespace <ns-id> --file keys.json [--yes]
```

### Durable Objects

```bash
cf durable-objects list
cf durable-objects objects list --namespace <ns-id>
```

### R2 Storage

```bash
# Buckets
cf r2 buckets list
cf r2 buckets get --name my-bucket
cf r2 buckets create --name my-bucket [--location WNAM]
cf r2 buckets delete --name my-bucket [--yes]

# CORS
cf r2 cors get --bucket my-bucket
cf r2 cors set --bucket my-bucket --file cors.json
cf r2 cors delete --bucket my-bucket [--yes]

# Lifecycle Rules
cf r2 lifecycle get --bucket my-bucket
cf r2 lifecycle set --bucket my-bucket --file lifecycle.json

# Custom Domains
cf r2 custom-domains list --bucket my-bucket
cf r2 custom-domains create --bucket my-bucket --zone example.com --hostname cdn.example.com
cf r2 custom-domains delete --bucket my-bucket --hostname cdn.example.com [--yes]

# Event Notifications
cf r2 event-notifications get --bucket my-bucket
cf r2 event-notifications create --bucket my-bucket --queue <queue-id> --event-type object-create

# Metrics
cf r2 metrics get --bucket my-bucket
```

### D1 Databases

```bash
cf d1 list
cf d1 get --id <db-id>
cf d1 create --name my-database
cf d1 delete --id <db-id> [--yes]
cf d1 query --id <db-id> --sql "SELECT * FROM users"
cf d1 export --id <db-id> --output-file dump.sql
cf d1 import --id <db-id> --file schema.sql
```

### Pages

```bash
# Projects
cf pages list
cf pages get --name my-site
cf pages create --name my-site --production-branch main
cf pages delete --name my-site [--yes]

# Deployments
cf pages deployments list --project my-site
cf pages deployments get --project my-site --id <deploy-id>
cf pages deployments delete --project my-site --id <deploy-id> [--yes]
cf pages deployments retry --project my-site --id <deploy-id>
cf pages deployments rollback --project my-site --id <deploy-id>

# Domains
cf pages domains list --project my-site
cf pages domains create --project my-site --name www.example.com
cf pages domains delete --project my-site --name www.example.com [--yes]
```

### Queues

```bash
cf queues list
cf queues get --id <queue-id>
cf queues create --name my-queue
cf queues delete --id <queue-id> [--yes]

# Consumers
cf queues consumers list --queue <queue-id>
cf queues consumers create --queue <queue-id> --service my-worker
cf queues consumers delete --queue <queue-id> --consumer <consumer-id> [--yes]

# Messages
cf queues send --queue <queue-id> --body '{"hello":"world"}'
```

### Hyperdrive

```bash
cf hyperdrive list
cf hyperdrive get --id <hd-id>
cf hyperdrive create --name my-hd --connection-string "postgres://user:pass@host:5432/db"
cf hyperdrive update --id <hd-id> --name new-name
cf hyperdrive delete --id <hd-id> [--yes]
```

### Pipelines

```bash
cf pipelines list
cf pipelines get --id <pipeline-id>
cf pipelines create --file pipeline-config.json
cf pipelines delete --id <pipeline-id> [--yes]
```

### Secrets Store

```bash
# Stores
cf secrets-store stores list
cf secrets-store stores get --id <store-id>
cf secrets-store stores create --name my-store
cf secrets-store stores delete --id <store-id> [--yes]

# Secrets
cf secrets-store secrets list --store <store-id>
cf secrets-store secrets get --store <store-id> --name MY_SECRET
cf secrets-store secrets set --store <store-id> --name MY_SECRET --value "secret-value"
cf secrets-store secrets delete --store <store-id> --name MY_SECRET [--yes]
```

### Rulesets

```bash
cf rulesets list --zone example.com
cf rulesets get --zone example.com --id <ruleset-id>
cf rulesets create --zone example.com --file ruleset.json
cf rulesets delete --zone example.com --id <ruleset-id> [--yes]

# Rules
cf rulesets rules list --zone example.com --ruleset <id>
cf rulesets rules create --zone example.com --ruleset <id> --file rule.json
cf rulesets rules update --zone example.com --ruleset <id> --rule <rule-id> --file rule.json
cf rulesets rules delete --zone example.com --ruleset <id> --rule <rule-id> [--yes]

# Versions
cf rulesets versions list --zone example.com --ruleset <id>
cf rulesets versions get --zone example.com --ruleset <id> --version <v>

# Phase Entrypoints
cf rulesets phases get --zone example.com --phase http_request_firewall_custom
```

### Firewall (Legacy)

```bash
# IP Access Rules
cf firewall ip-rules list --zone example.com
cf firewall ip-rules create --zone example.com --mode block --ip 1.2.3.4 --notes "Bad actor"
cf firewall ip-rules delete --zone example.com --id <id> [--yes]

# User-Agent Rules
cf firewall ua-rules list --zone example.com
cf firewall ua-rules create --zone example.com --file ua-rule.json
cf firewall ua-rules delete --zone example.com --id <id> [--yes]

# Zone Lockdowns
cf firewall zone-lockdowns list --zone example.com
cf firewall zone-lockdowns create --zone example.com --file lockdown.json
cf firewall zone-lockdowns delete --zone example.com --id <id> [--yes]
```

### Page Shield

```bash
cf page-shield settings get --zone example.com
cf page-shield settings update --zone example.com --enabled true
cf page-shield scripts list --zone example.com
cf page-shield connections list --zone example.com
cf page-shield policies list --zone example.com
cf page-shield policies create --zone example.com --file policy.json
cf page-shield policies delete --zone example.com --id <id> [--yes]
```

### Turnstile

```bash
cf turnstile list
cf turnstile get --sitekey <key>
cf turnstile create --name my-widget --domains example.com --mode managed
cf turnstile update --sitekey <key> --name new-name
cf turnstile delete --sitekey <key> [--yes]
cf turnstile rotate-secret --sitekey <key>
```

### API Gateway

```bash
cf api-gateway settings get --zone example.com
cf api-gateway settings update --zone example.com --enabled true
cf api-gateway schemas list --zone example.com
cf api-gateway schemas upload --zone example.com --file openapi.json
cf api-gateway schemas delete --zone example.com --id <id> [--yes]
```

### Rate Limits (Legacy)

```bash
cf rate-limits list --zone example.com
cf rate-limits get --zone example.com --id <id>
cf rate-limits create --zone example.com --file rate-limit.json
cf rate-limits update --zone example.com --id <id> --file rate-limit.json
cf rate-limits delete --zone example.com --id <id> [--yes]
```

### Tunnels (Cloudflare Tunnel)

```bash
cf tunnels list
cf tunnels get --id <tunnel-id>
cf tunnels create --name my-tunnel
cf tunnels delete --id <tunnel-id> [--yes]
cf tunnels token --id <tunnel-id>

# Config
cf tunnels config get --id <tunnel-id>
cf tunnels config update --id <tunnel-id> --file config.json

# Connections
cf tunnels connections list --id <tunnel-id>
cf tunnels connections delete --id <tunnel-id> --connection <conn-id> [--yes]
```

### Zero Trust - Devices

```bash
cf devices list
cf devices get --id <device-id>
cf devices revoke --id <device-id> [--yes]

# Registrations
cf devices registrations list
cf devices registrations get --id <reg-id>
cf devices registrations delete --id <reg-id> [--yes]

# Posture Rules
cf devices posture rules list
cf devices posture rules get --id <rule-id>
cf devices posture rules create --file posture-rule.json
cf devices posture rules update --id <rule-id> --file posture-rule.json
cf devices posture rules delete --id <rule-id> [--yes]
```

### WARP

```bash
cf warp settings get
cf warp settings update --file settings.json
cf warp split-tunnels list
cf warp split-tunnels add --address 10.0.0.0/8 --description "Internal network"
cf warp split-tunnels delete --address 10.0.0.0/8 [--yes]
cf warp fleet-status
```

### Zero Trust - Access

```bash
# Applications (zone or account scoped)
cf access apps list --zone example.com
cf access apps get --zone example.com --id <app-id>
cf access apps create --zone example.com --file app.json
cf access apps update --zone example.com --id <app-id> --file app.json
cf access apps delete --zone example.com --id <app-id> [--yes]

# Policies
cf access policies list --zone example.com --app <app-id>
cf access policies create --zone example.com --app <app-id> --file policy.json

# Service Tokens
cf access service-tokens list
cf access service-tokens create --name my-token
cf access service-tokens delete --id <token-id> [--yes]

# Groups
cf access groups list
cf access groups create --file group.json

# Users & Sessions
cf access users list
cf access users sessions list --id <user-id>

# Certificates
cf access certificates list --zone example.com
cf access certificates create --zone example.com --file cert.json

# Identity Providers
cf access idps list
cf access idps create --file idp.json
```

### Zero Trust - Gateway

```bash
# DNS Policies
cf gateway dns list
cf gateway dns create --file dns-policy.json
cf gateway dns delete --id <id> [--yes]

# HTTP Policies
cf gateway http list
cf gateway http create --file http-policy.json
cf gateway http delete --id <id> [--yes]

# Network Policies
cf gateway network list
cf gateway network create --file network-policy.json
cf gateway network delete --id <id> [--yes]

# DLP Profiles
cf gateway dlp list
cf gateway dlp get --id <profile-id>
cf gateway dlp create --file dlp-profile.json
```

### SSL/TLS

```bash
cf ssl analyze --zone example.com
cf ssl universal get --zone example.com
cf ssl universal update --zone example.com --enabled true
cf ssl verification list --zone example.com
cf ssl advanced list --zone example.com
cf ssl advanced create --zone example.com --file cert-pack.json
cf ssl custom list --zone example.com
cf ssl custom create --zone example.com --file custom-cert.json
cf ssl client list --zone example.com
cf ssl keyless list --zone example.com
cf ssl origin-ca list
cf ssl origin-ca create --file origin-ca.json
cf ssl mtls list --zone example.com
cf ssl dcv-delegation get --zone example.com
cf ssl recommendations get --zone example.com
cf ssl post-quantum get --zone example.com
```

### Load Balancers

```bash
cf lb list --zone example.com
cf lb get --zone example.com --id <lb-id>
cf lb create --zone example.com --file lb.json
cf lb update --zone example.com --id <lb-id> --file lb.json
cf lb delete --zone example.com --id <lb-id> [--yes]

# Pools
cf lb pools list
cf lb pools get --id <pool-id>
cf lb pools create --file pool.json
cf lb pools health --id <pool-id>
cf lb pools preview --file pool.json

# Monitors
cf lb monitors list
cf lb monitors get --id <monitor-id>
cf lb monitors create --file monitor.json
cf lb monitors preview --file monitor.json

# Regions
cf lb regions list
```

### Healthchecks

```bash
cf healthchecks list --zone example.com
cf healthchecks get --zone example.com --id <hc-id>
cf healthchecks create --zone example.com --file healthcheck.json
cf healthchecks update --zone example.com --id <hc-id> --file healthcheck.json
cf healthchecks delete --zone example.com --id <hc-id> [--yes]
cf healthchecks preview --zone example.com --file healthcheck.json
```

### Cache

```bash
# Purge
cf cache purge --zone example.com --everything [--yes]
cf cache purge --zone example.com --urls "https://example.com/page1,https://example.com/page2"
cf cache purge --zone example.com --tags "tag1,tag2"
cf cache purge --zone example.com --prefixes "/api/,/static/"

# Cache Reserve
cf cache-reserve get --zone example.com
cf cache-reserve update --zone example.com --enabled true

# Tiered Cache
cf tiered-cache get --zone example.com
cf tiered-cache update --zone example.com --value smart

# Argo Smart Routing
cf argo get --zone example.com
cf argo update --zone example.com --enabled true
```

### Waiting Rooms

```bash
cf waiting-rooms list --zone example.com
cf waiting-rooms get --zone example.com --id <wr-id>
cf waiting-rooms create --zone example.com --file waiting-room.json
cf waiting-rooms delete --zone example.com --id <wr-id> [--yes]
cf waiting-rooms status --zone example.com --id <wr-id>

# Events
cf waiting-rooms events list --zone example.com --room <wr-id>
cf waiting-rooms events create --zone example.com --room <wr-id> --file event.json

# Rules
cf waiting-rooms rules upsert --zone example.com --room <wr-id> --file rules.json
```

### Observatory (Speed)

```bash
cf observatory pages list --zone example.com
cf observatory tests list --zone example.com --url "https://example.com"
cf observatory tests create --zone example.com --url "https://example.com"
cf observatory tests get --zone example.com --id <test-id>
cf observatory tests delete --zone example.com --url "https://example.com" [--yes]
cf observatory schedule get --zone example.com --url "https://example.com"
cf observatory schedule create --zone example.com --url "https://example.com" --region us-east
cf observatory schedule delete --zone example.com --url "https://example.com" [--yes]
```

### Stream

```bash
# Videos
cf stream list
cf stream get --id <video-id>
cf stream upload --file video.mp4
cf stream delete --id <video-id> [--yes]
cf stream download --id <video-id>

# Live Inputs
cf stream live list
cf stream live get --id <input-id>
cf stream live create --file live-input.json
cf stream live delete --id <input-id> [--yes]

# Captions
cf stream captions list --video <video-id>
cf stream captions upload --video <video-id> --language en --file captions.vtt

# Audio Tracks
cf stream audio list --video <video-id>

# Signing Keys, Watermarks, Webhooks
cf stream signing-keys list
cf stream signing-keys create
cf stream watermarks list
cf stream watermarks create --file watermark.json
cf stream webhooks get
cf stream webhooks update --url https://example.com/webhook
```

### Images

```bash
cf images list
cf images get --id <image-id>
cf images create --file image.png
cf images update --id <image-id> --name new-name
cf images delete --id <image-id> [--yes]
cf images direct-upload
cf images stats

# Variants
cf images variants list
cf images variants create --file variant.json
cf images variants delete --id <variant-id> [--yes]

# Signing Keys
cf images signing-keys list
```

### Calls / WebRTC

```bash
cf calls apps list
cf calls apps get --id <app-id>
cf calls apps create --name my-app
cf calls apps delete --id <app-id> [--yes]

cf calls turn-keys list
cf calls turn-keys create --name my-key
cf calls turn-keys delete --id <key-id> [--yes]
```

### Workers AI

```bash
cf ai run --model @cf/meta/llama-3-8b-instruct --prompt "Hello world"
cf ai run --model @cf/meta/llama-3-8b-instruct --file input.json
cf ai models list [--task text-generation]
cf ai models get --model @cf/meta/llama-3-8b-instruct

# Fine-tuning
cf ai fine-tuning list
cf ai fine-tuning get --id <ft-id>
cf ai fine-tuning create --file finetune-config.json
cf ai fine-tuning delete --id <ft-id> [--yes]
```

### AI Gateway

```bash
cf ai-gateway list
cf ai-gateway get --id <gw-id>
cf ai-gateway create --file gateway.json
cf ai-gateway update --id <gw-id> --file gateway.json
cf ai-gateway delete --id <gw-id> [--yes]

cf ai-gateway logs list --gateway <gw-id>
cf ai-gateway datasets list --gateway <gw-id>
cf ai-gateway evaluations list --gateway <gw-id>
```

### Vectorize

```bash
cf vectorize list
cf vectorize get --name my-index
cf vectorize create --name my-index --dimensions 768 --metric cosine
cf vectorize delete --name my-index [--yes]

# Vectors
cf vectorize insert --name my-index --file vectors.ndjson
cf vectorize upsert --name my-index --file vectors.ndjson
cf vectorize query --name my-index --file query.json
cf vectorize vectors get --name my-index --ids "id1,id2"
cf vectorize vectors delete --name my-index --ids "id1,id2" [--yes]

# Metadata Indexes
cf vectorize metadata-index list --name my-index
cf vectorize metadata-index create --name my-index --property-name category --type string
cf vectorize metadata-index delete --name my-index --property-name category [--yes]
```

### Magic Transit

```bash
# GRE Tunnels
cf magic-transit gre-tunnels list
cf magic-transit gre-tunnels get --id <id>
cf magic-transit gre-tunnels create --file tunnel.json
cf magic-transit gre-tunnels update --id <id> --file tunnel.json
cf magic-transit gre-tunnels delete --id <id> [--yes]

# IPsec Tunnels
cf magic-transit ipsec-tunnels list
cf magic-transit ipsec-tunnels get --id <id>
cf magic-transit ipsec-tunnels create --file tunnel.json
cf magic-transit ipsec-tunnels delete --id <id> [--yes]
cf magic-transit ipsec-tunnels psk --id <id>

# Sites (with LANs and WANs)
cf magic-transit sites list
cf magic-transit sites get --id <id>
cf magic-transit sites create --file site.json
cf magic-transit sites delete --id <id> [--yes]

# Routes
cf magic-transit routes list
cf magic-transit routes create --file route.json
cf magic-transit routes delete --id <id> [--yes]

# ACLs
cf magic-transit acls list
cf magic-transit acls create --file acl.json
cf magic-transit acls delete --id <id> [--yes]

# PCAPs
cf magic-transit pcaps list
cf magic-transit pcaps get --id <id>
cf magic-transit pcaps create --file pcap-request.json
cf magic-transit pcaps download --id <id> --output-file capture.pcap
```

### Magic Network Monitoring

```bash
cf mnm config get
cf mnm config update --file config.json
cf mnm rules list
cf mnm rules get --id <id>
cf mnm rules create --file rule.json
cf mnm rules update --id <id> --file rule.json
cf mnm rules delete --id <id> [--yes]
```

### Addressing

```bash
# Address Maps
cf addressing address-maps list
cf addressing address-maps get --id <id>
cf addressing address-maps create --file address-map.json
cf addressing address-maps delete --id <id> [--yes]

# Prefixes
cf addressing prefixes list
cf addressing prefixes get --id <id>
cf addressing prefixes create --file prefix.json
cf addressing prefixes delete --id <id> [--yes]
cf addressing prefixes bgp get --prefix <id>
cf addressing prefixes bgp update --prefix <id> --on-demand true
cf addressing prefixes delegations list --prefix <id>
cf addressing prefixes delegations create --prefix <id> --file delegation.json
cf addressing prefixes delegations delete --prefix <id> --id <delegation-id> [--yes]

# Regional Hostnames
cf addressing regional-hostnames list --zone example.com
cf addressing regional-hostnames get --zone example.com --hostname api.example.com
cf addressing regional-hostnames create --zone example.com --hostname api.example.com --region-key us
cf addressing regional-hostnames delete --zone example.com --hostname api.example.com [--yes]
```

### Spectrum

```bash
cf spectrum apps list --zone example.com
cf spectrum apps get --zone example.com --id <id>
cf spectrum apps create --zone example.com --file app.json
cf spectrum apps update --zone example.com --id <id> --file app.json
cf spectrum apps delete --zone example.com --id <id> [--yes]

cf spectrum analytics summary --zone example.com
cf spectrum analytics bytes --zone example.com
```

### Radar

```bash
cf radar http --metric requests [--from 2024-01-01] [--to 2024-01-31]
cf radar dns
cf radar bgp
cf radar attacks
cf radar bots
cf radar email
cf radar as --asn 13335
cf radar locations
cf radar datasets
cf radar annotations [--from 2024-01-01]
```

### Threat Intelligence

```bash
cf intel domain --domain example.com
cf intel ip --ip 1.2.3.4
cf intel asn --asn 13335
cf intel dns --domain example.com
cf intel whois --domain example.com
cf intel ip-lists
cf intel attack-surface --domain example.com
```

### URL Scanner

```bash
cf url-scanner scan --url https://example.com
cf url-scanner search --query example.com
cf url-scanner get --id <scan-uuid>
cf url-scanner har --id <scan-uuid>
cf url-scanner dom --id <scan-uuid>
cf url-scanner screenshot --id <scan-uuid> --output-file screenshot.png
cf url-scanner bulk --file urls.json
```

### Cloudforce One

```bash
cf cf1 requests list
cf cf1 requests get --id <req-id>
cf cf1 requests create --file request.json
cf cf1 threat-events
cf cf1 pirs
cf cf1 scans
```

### Logpush

```bash
# Zone-scoped
cf logpush jobs list --zone example.com
cf logpush jobs get --zone example.com --id <job-id>
cf logpush jobs create --zone example.com --file job.json
cf logpush jobs update --zone example.com --id <job-id> --file job.json
cf logpush jobs delete --zone example.com --id <job-id> [--yes]
cf logpush jobs enable --zone example.com --id <job-id>
cf logpush jobs disable --zone example.com --id <job-id>

# Account-scoped
cf logpush jobs list --account-id <id>

cf logpush datasets --zone example.com
cf logpush instant --zone example.com --file instant-config.json
cf logpush ownership --zone example.com
```

### Web Analytics (RUM)

```bash
cf web-analytics sites list
cf web-analytics sites get --id <site-tag>
cf web-analytics sites create --host example.com
cf web-analytics sites update --id <site-tag> --host new.example.com
cf web-analytics sites delete --id <site-tag> [--yes]

cf web-analytics rules list --site <site-tag>
cf web-analytics rules create --site <site-tag> --file rule.json
cf web-analytics rules delete --site <site-tag> --id <rule-id> [--yes]
```

### Zaraz

```bash
cf zaraz config-get --zone example.com
cf zaraz config-update --zone example.com --file config.json
cf zaraz publish --zone example.com
cf zaraz workflow --zone example.com
cf zaraz export --zone example.com
cf zaraz history-list --zone example.com
cf zaraz history-get --zone example.com --id <id>
```

### Email Routing

```bash
# Settings
cf email-routing settings get --zone example.com
cf email-routing settings enable --zone example.com
cf email-routing settings disable --zone example.com [--yes]
cf email-routing dns --zone example.com

# Addresses (account-scoped)
cf email-routing addresses list
cf email-routing addresses get --id <addr-id>
cf email-routing addresses create --email user@example.com
cf email-routing addresses delete --id <addr-id> [--yes]

# Rules
cf email-routing rules list --zone example.com
cf email-routing rules get --zone example.com --id <rule-id>
cf email-routing rules create --zone example.com --file rule.json
cf email-routing rules update --zone example.com --id <rule-id> --file rule.json
cf email-routing rules delete --zone example.com --id <rule-id> [--yes]
cf email-routing rules catch-all get --zone example.com
cf email-routing rules catch-all update --zone example.com --file catchall.json
```

### Alerts and Notifications

```bash
cf alerts list
cf alerts get --id <policy-id>
cf alerts create --file alert-policy.json
cf alerts update --id <policy-id> --file alert-policy.json
cf alerts delete --id <policy-id> [--yes]
cf alerts history [--from 2024-01-01] [--to 2024-01-31]
cf alerts available

# Webhooks
cf alerts destinations webhooks list
cf alerts destinations webhooks create --name my-webhook --url https://example.com/hook
cf alerts destinations webhooks update --id <id> --url https://new-url.com/hook
cf alerts destinations webhooks delete --id <id> [--yes]

# PagerDuty
cf alerts destinations pagerduty list
cf alerts destinations pagerduty connect
cf alerts destinations pagerduty delete --id <id> [--yes]

# Silences
cf alerts silences list
cf alerts silences create --file silence.json
cf alerts silences delete --id <id> [--yes]
```

### Rules Lists

```bash
cf rules-lists list
cf rules-lists get --id <list-id>
cf rules-lists create --name my-list --kind ip [--description "Block list"]
cf rules-lists update --id <list-id> --description "Updated description"
cf rules-lists delete --id <list-id> [--yes]

# Items
cf rules-lists items list --list <list-id>
cf rules-lists items add --list <list-id> --file items.json
cf rules-lists items replace --list <list-id> --file items.json
cf rules-lists items delete --list <list-id> --ids "id1,id2,id3" [--yes]
```

### Snippets

```bash
cf snippets list --zone example.com
cf snippets get --zone example.com --name my-snippet
cf snippets create --zone example.com --name my-snippet --file snippet.js
cf snippets update --zone example.com --name my-snippet --file snippet.js
cf snippets delete --zone example.com --name my-snippet [--yes]

cf snippets rules list --zone example.com
cf snippets rules upsert --zone example.com --file rules.json
```

### Registrar

```bash
cf registrar list
cf registrar get --domain example.com
cf registrar update --domain example.com [--auto-renew] [--locked] [--privacy]
cf registrar transfer-in --domain example.com
```

### Accounts

```bash
cf accounts list
cf accounts get --id <account-id>

# Members
cf accounts members list --account-id <id>
cf accounts members get --account-id <id> --id <member-id>
cf accounts members add --account-id <id> --email user@example.com --roles role1,role2
cf accounts members update --account-id <id> --id <member-id> --roles role1,role2
cf accounts members remove --account-id <id> --id <member-id> [--yes]

# Roles
cf accounts roles list --account-id <id>
cf accounts roles get --account-id <id> --id <role-id>

# Subscriptions
cf accounts subscriptions list --account-id <id>
cf accounts subscriptions get --account-id <id> --id <sub-id>
```

### User

```bash
cf user get
cf user token verify

# Billing
cf user billing profile
cf user billing history [--page 1] [--per-page 20]

# API Tokens
cf user tokens list
cf user tokens get --id <token-id>
cf user tokens create --name my-token --file token-policy.json
cf user tokens update --id <token-id> [--name new-name] [--status disabled]
cf user tokens delete --id <token-id> [--yes]
cf user tokens verify
cf user tokens roll --id <token-id>
```

### Audit Logs

```bash
cf audit-logs list --account-id <id> \
  [--user-email user@example.com] \
  [--action-type create] \
  [--resource-type zone] \
  [--from 2024-01-01] [--to 2024-01-31] \
  [--direction desc] [--per-page 50]
```

### Page Rules (Legacy)

```bash
cf page-rules list --zone example.com
cf page-rules get --zone example.com --id <rule-id>
cf page-rules create --zone example.com --file pagerule.json
cf page-rules update --zone example.com --id <rule-id> --file pagerule.json
cf page-rules delete --zone example.com --id <rule-id> [--yes]
```

### CLI Configuration

```bash
cf config set --name default --token your-api-token
cf config get --name default
cf config list
cf config delete --name staging [--yes]
cf config use --name production
```

### Shell Completions

```bash
cf completion bash >> ~/.bashrc
cf completion zsh >> ~/.zshrc
cf completion fish > ~/.config/fish/completions/cf.fish
```

## Output Formats

All list and detail commands support multiple output formats:

```bash
cf zones list                      # Table (default)
cf zones list --output json        # JSON
cf zones list --output csv         # CSV
cf zones list --output yaml        # YAML
cf zones list --raw                # Raw API response
```

## Features

- **Complete API coverage**: 50+ resource groups covering the entire Cloudflare REST API
- **Zero dependencies**: Single bundled binary, no external packages
- **Multiple auth methods**: API tokens, global API keys, config profiles
- **Multi-format output**: Table, JSON, CSV, YAML with `NO_COLOR` spec compliance
- **Smart resolution**: Zone names auto-resolve to IDs (`--zone example.com` works everywhere)
- **Account auto-detection**: Account ID resolves from flag, config, or API auto-detect
- **Confirmation prompts**: All destructive operations require confirmation (bypass with `--yes`)
- **Rate limit handling**: Automatic retry with exponential backoff on 429 responses
- **Auto-pagination**: Large result sets are automatically paginated
- **Shell completions**: bash, zsh, and fish completion scripts

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Type check
bun run typecheck

# Build
bun run build

# Run from source
bun run src/index.ts zones list
```

## License

MIT
