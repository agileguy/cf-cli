# Output Formats & Automation Scripting

`cf` is designed for human terminal readability and script automation alike. Every list, get, and mutation command supports structured multi-format output.

---

## 1. Supported Output Formats

Pass the `--output <format>` flag (or set `output: "<format>"` in your default config):

```bash
# Formatted ASCII table (default)
cf dns list --zone example.com --output table

# Pretty-printed JSON
cf dns list --zone example.com --output json

# Standard comma-separated values
cf dns list --zone example.com --output csv

# Clean YAML
cf dns list --zone example.com --output yaml

# Raw API JSON payload directly from Cloudflare
cf dns list --zone example.com --raw
```

---

## 2. Terminal Styling & Color Support

`cf` conforms strictly to the [NO_COLOR](https://no-color.org/) standard.

* Use `--no-color` to disable ANSI colors and styling:
  ```bash
  cf zones list --no-color
  ```
* Setting the environment variable `NO_COLOR=1` automatically suppresses colors for all invocations:
  ```bash
  export NO_COLOR=1
  ```
* In non-interactive environments (e.g., cron jobs, CI loggers), colors are automatically omitted.

---

## 3. Quiet Mode for Shell Scripts

When invoking `cf` from within shell scripts, use `--quiet` to suppress progress and status outputs:

```bash
cf dns create --zone example.com --type A --name api --content 1.2.3.4 --quiet
```

*(Note: Errors will still be written to `stderr` even in `--quiet` mode).*

---

## 4. Scripting Recipes with `jq`

Pairing `cf`'s JSON output with `jq` creates powerful operational one-liners:

### Extract All Zone IDs and Names
```bash
cf zones list --output json | jq -r '.[] | "\(.id)\t\(.name)"'
```

### Find All Stale DNS Records
```bash
cf dns list --zone example.com --output json | jq -r '.[] | select(.type=="CNAME") | .name'
```

### Extract Public Worker URLs
```bash
cf workers domains list --output json | jq -r '.[] | "\(.service) -> https://\(.hostname)"'
```

### Export CSV to a Spreadsheet File
```bash
cf audit-logs list --output csv > audit_report_$(date +%F).csv
```
