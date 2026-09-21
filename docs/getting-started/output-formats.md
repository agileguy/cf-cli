# Output Formats & Automation Scripting

`cf` is designed for human terminal readability and script automation alike.

---

## 1. Supported Output Formats

**Status: not yet implemented for most commands.** A per-command `--output <format>` flag (table/json/csv/yaml), and the matching `output: "<format>"` default-config setting, are planned but today only `d1 query` reads an `--output` flag (and only for `json` or `csv`; anything else falls back to its table) — every other command always prints its default formatted table, regardless of `--output`.

```bash
# Works everywhere today: prints the unmodified Cloudflare API envelope as JSON.
# Note it is printed IN ADDITION TO the command's usual table, not instead of it,
# so this is not yet a clean source for `jq`.
cf dns list --zone example.com --raw

# The only command with an --output flag today (json or csv; default is table)
cf d1 query --database mydb "SELECT * FROM users" --output json
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
