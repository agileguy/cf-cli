# `cf pages` — Cloudflare Pages JAMstack Management

Manage Cloudflare Pages projects, deployments, build configurations, and custom domains.

---

## Required Permissions

| Action | Scope Level | Minimum API Token Permission |
|--------|-------------|------------------------------|
| Read   | Account     | `Cloudflare Pages:Read`      |
| Write  | Account     | `Cloudflare Pages:Edit`      |

---

## Subcommands Overview

- [`cf pages list`](#cf-pages-list) — List all Pages projects in an account
- [`cf pages get`](#cf-pages-get) — Get project details, production branch, and latest deployment
- [`cf pages create`](#cf-pages-create) — Create a new Pages project
- [`cf pages delete`](#cf-pages-delete) — Remove a Pages project
- [`cf pages deployments`](#cf-pages-deployments) — Inspect and trigger preview or production deployments
- [`cf pages domains`](#cf-pages-domains) — Manage custom domains associated with a project

---

### `cf pages list`

Lists all Pages projects in your account.

#### Syntax
```bash
cf pages list
```

---

### `cf pages create`

Creates a new Pages project.

#### Syntax
```bash
cf pages create --name <project-name> [--production-branch <branch>]
```

#### Example
```bash
cf pages create --name my-marketing-site --production-branch main
```

---

### `cf pages deployments`

Manage deployments for preview branches and production.

```bash
# List recent deployments for a project
cf pages deployments list --project my-marketing-site

# Get status, logs, and preview URL of a specific deployment
cf pages deployments get --project my-marketing-site --id <deployment-id>

# Trigger a direct upload deployment from a local build directory
cf pages deployments create --project my-marketing-site --directory ./dist [--branch preview]

# Rollback project to a previous deployment
cf pages deployments rollback --project my-marketing-site --id <deployment-id> --yes
```

---

### `cf pages domains`

Map apex domains and subdomains to your Pages application.

```bash
# List all custom domains mapped to the project
cf pages domains list --project my-marketing-site

# Add a custom domain (auto-configures SSL and DNS verification)
cf pages domains add --project my-marketing-site --domain blog.example.com

# Delete a custom domain binding
cf pages domains delete --project my-marketing-site --domain blog.example.com --yes
```
