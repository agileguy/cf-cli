# `cf rulesets` — Modern Rulesets & WAF Management

Manage Cloudflare Rulesets engine rules, modern Web Application Firewall (WAF) configurations, HTTP request/response transformations, and phase entry points at both Account and Zone levels.

---

## Required Permissions

| Action | Scope Level | Minimum API Token Permission |
|--------|-------------|------------------------------|
| Read   | Account / Zone | `Rulesets:Read`           |
| Write  | Account / Zone | `Rulesets:Edit`           |

---

## Subcommands Overview

- [`cf rulesets list`](#cf-rulesets-list) — List available rulesets at account or zone scope
- [`cf rulesets get`](#cf-rulesets-get) — Inspect ruleset details and its contained rules
- [`cf rulesets create`](#cf-rulesets-create) — Create a custom ruleset
- [`cf rulesets delete`](#cf-rulesets-delete) — Remove a custom ruleset
- [`cf rulesets rules`](#cf-rulesets-rules) — Add, modify, or remove rules inside a ruleset
- [`cf rulesets phases`](#cf-rulesets-phases) — Manage phase entry points (e.g. `http_request_firewall_custom`)
- [`cf rulesets versions`](#cf-rulesets-versions) — List and view immutable version history

---

### `cf rulesets list`

Lists all rulesets within a zone or account.

```bash
# List rulesets for a zone
cf rulesets list --zone example.com

# List rulesets across account
cf rulesets list --account-id <id>
```

---

### `cf rulesets get`

Retrieve the rules and expressions inside a ruleset.

```bash
cf rulesets get --zone example.com --id <ruleset-id>
```

---

### `cf rulesets rules`

Manage individual rules with Wirefilter boolean expressions.

```bash
# List all rules inside a ruleset
cf rulesets rules list --zone example.com --ruleset-id <ruleset-id>

# Add a rule from a JSON definition file
cf rulesets rules add --zone example.com --ruleset-id <ruleset-id> --file rule.json

# Update an existing rule
cf rulesets rules update --zone example.com --ruleset-id <ruleset-id> --rule-id <rule-id> --file rule.json

# Delete a rule
cf rulesets rules delete --zone example.com --ruleset-id <ruleset-id> --rule-id <rule-id> --yes
```

*Example `rule.json` (Block requests from high-threat countries):*
```json
{
  "action": "block",
  "expression": "(ip.geoip.country in {\"CN\" \"RU\"} and not cf.client.bot)",
  "description": "Block high risk regions"
}
```

---

### `cf rulesets phases`

Inspect and update the root phase entry points that execute when requests arrive at the Cloudflare edge.

```bash
# View active entry point ruleset for custom WAF firewall phase
cf rulesets phases get --zone example.com --phase http_request_firewall_custom

# Update phase entry point
cf rulesets phases update --zone example.com --phase http_request_firewall_custom --file phase-entrypoint.json
```
