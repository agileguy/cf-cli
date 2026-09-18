# CI/CD & Pipeline Automation Guide

Integrating `cf` into automated deployment pipelines (such as GitHub Actions, GitLab CI, or CircleCI) allows you to automate edge deployments, cache purging, DNS validation, and database operations.

---

## 1. Automation Principles

* **Always pass `--yes`**: Destructive operations (such as `delete` or `purge`) require interactive confirmation by default. In headless environments, pass `--yes` to auto-confirm without blocking on stdin.
* **Authenticate via Repository Secrets**: Supply `CF_API_TOKEN` (or `CLOUDFLARE_API_TOKEN`) via secure environment variables. Never hardcode credentials.
* **Use JSON Output for Pipeline Parsing**: Pass `--output json` and pipe directly into `jq` to extract values for subsequent workflow steps.
* **Exit Codes**:
  * `0`: Success
  * `1`: API error, invalid arguments, or authentication failure

---

## 2. GitHub Actions Workflow Examples

### Example A: Automatic Cache Purge on Website Deploy
Purge edge cache whenever new assets are deployed to your origin:

```yaml
name: Deploy & Purge Cache

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Bun
        uses: oven-sh/setup-bun@v2

      - name: Install cf CLI
        run: bun install -g @agileguy/cf-cli

      - name: Purge Cloudflare Cache
        env:
          CF_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: |
          cf cache purge --zone example.com --everything --yes
```

### Example B: Automated Workers Script Deployment
Deploy a serverless Worker bundle and configure its route:

```yaml
name: Deploy Worker

on:
  release:
    types: [published]

jobs:
  worker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install cf CLI
        run: npm install -g @agileguy/cf-cli

      - name: Deploy Worker Bundle
        env:
          CF_API_TOKEN: ${{ secrets.CF_WORKER_DEPLOY_TOKEN }}
          CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
        run: |
          cf workers deploy --name production-api --file dist/worker.js --yes
          cf workers routes create --zone example.com --pattern "api.example.com/*" --script production-api
```

### Example C: D1 Database Migration Pipeline
Execute schema migrations against a Cloudflare D1 SQL database:

```yaml
name: Database Migration

on:
  push:
    paths:
      - "migrations/**"

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install cf CLI
        run: npm install -g @agileguy/cf-cli

      - name: Run SQL Migration
        env:
          CF_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: |
          for file in migrations/*.sql; do
            echo "Executing $file..."
            cf d1 execute --database prod-db --file "$file"
          done
```
