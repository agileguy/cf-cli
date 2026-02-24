#!/usr/bin/env bun

import type { GlobalFlags, Context } from "./types/index.js";
import { loadCredentials } from "./auth.js";
import { readConfig } from "./config.js";
import { CloudflareHttpClient } from "./client.js";
import { OutputFormatterImpl } from "./output.js";
import { setNoColor } from "./utils/colors.js";
import { CloudflareAPIError, UsageError, AuthError } from "./utils/errors.js";
import { parseArgs, getBoolFlag, getStringFlag } from "./utils/args.js";

const VERSION = "0.1.0";

const HELP_TEXT = `
cf-cli v${VERSION} — Cloudflare CLI

USAGE:
  cf <resource> <action> [options]

RESOURCES:
  zones          List, create, delete, and manage zones
  dns            Manage DNS records (list, create, update, delete, import, export)
  workers        Manage Workers (scripts, routes, cron, domains, versions, platforms, tail)
  kv             Manage Workers KV (namespaces, keys, bulk operations)
  durable-objects  Manage Durable Objects (namespaces, objects)
  r2             Manage R2 storage (buckets, CORS, lifecycle, custom domains, events, metrics)
  d1             Manage D1 databases (CRUD, query, import, export)
  pages          Manage Pages projects (deployments, domains)
  queues         Manage Queues (CRUD, consumers, messages)
  hyperdrive     Manage Hyperdrive configurations (database connection pooling)
  pipelines      Manage Pipelines (data ingestion)
  secrets-store  Manage Secrets Store (stores, secrets)
  accounts       List accounts
  user           Show current user information
  cache          Purge cached content
  config         Manage CLI configuration and profiles
  completion     Generate shell completions (bash, zsh, fish)

GLOBAL FLAGS:
  --profile <name>    Use a specific auth profile
  --output <format>   Output format: table, json, csv, yaml (default: table)
  --raw               Show raw API response JSON
  --verbose           Show debug output (HTTP requests, timing)
  --quiet             Suppress non-essential output
  --no-color          Disable colored output
  --yes               Auto-confirm destructive operations
  --help              Show this help message
  --version           Show version

AUTHENTICATION:
  Set up credentials using environment variables or config profiles:
    CF_API_TOKEN         Cloudflare API token (recommended)
    CF_API_KEY           Cloudflare global API key
    CF_API_EMAIL         Cloudflare account email (required with API key)
    CF_PROFILE           Config profile name to use

  Or configure a profile:
    cf config set-profile --name default --token <your-token>

EXAMPLES:
  cf zones list
  cf dns list --zone example.com
  cf dns create --zone example.com --type A --name www --content 1.2.3.4
  cf user info
  cf accounts list
`.trim();

/** Parse global flags from process.argv */
function parseGlobalFlags(): { flags: GlobalFlags; resource: string; action: string; rest: string[] } {
  const rawArgs = process.argv.slice(2);
  const parsed = parseArgs(rawArgs);

  const flags: GlobalFlags = {
    profile: getStringFlag(parsed.flags, "profile"),
    output: getStringFlag(parsed.flags, "output") as GlobalFlags["output"],
    raw: getBoolFlag(parsed.flags, "raw") || undefined,
    verbose: getBoolFlag(parsed.flags, "verbose") || undefined,
    quiet: getBoolFlag(parsed.flags, "quiet") || undefined,
    noColor: getBoolFlag(parsed.flags, "noColor") || getBoolFlag(parsed.flags, "color") === false || undefined,
    yes: getBoolFlag(parsed.flags, "yes") || undefined,
  };

  // Clean up undefined values for exactOptionalPropertyTypes
  if (flags.raw === undefined) delete flags.raw;
  if (flags.verbose === undefined) delete flags.verbose;
  if (flags.quiet === undefined) delete flags.quiet;
  if (flags.noColor === undefined) delete flags.noColor;
  if (flags.yes === undefined) delete flags.yes;

  const resource = parsed.positional[0] ?? "";
  const action = parsed.positional[1] ?? "";
  const rest = parsed.positional.slice(2);

  return { flags, resource, action, rest };
}

/** Build a Context from flags and config */
function buildContext(flags: GlobalFlags): Context {
  const config = readConfig();

  // Apply defaults from config
  if (!flags.output && config.defaults.output) {
    flags.output = config.defaults.output;
  }
  if (flags.noColor === undefined && config.defaults.no_color) {
    flags.noColor = true;
  }

  // Set color mode
  if (flags.noColor) {
    setNoColor(true);
  }

  // Load credentials and create client
  const credentials = loadCredentials(flags.profile, config);
  const client = new CloudflareHttpClient(credentials, flags);
  const output = new OutputFormatterImpl(flags);

  return { client, output, flags, config };
}

async function main(): Promise<void> {
  const { flags, resource, action, rest: _rest } = parseGlobalFlags();

  // Handle --help or no args
  if (resource === "" || resource === "help" || process.argv.includes("--help")) {
    process.stdout.write(HELP_TEXT + "\n");
    return;
  }

  // Handle --version
  if (resource === "version" || resource === "--version") {
    process.stdout.write(`cf-cli v${VERSION}\n`);
    return;
  }

  // Build context (requires auth for most commands)
  let ctx: Context;
  try {
    ctx = buildContext(flags);
  } catch (err: unknown) {
    // Config command doesn't need auth
    if (resource === "config") {
      const config = readConfig();
      const output = new OutputFormatterImpl(flags);
      if (flags.noColor) setNoColor(true);
      ctx = {
        client: null as unknown as Context["client"],
        output,
        flags,
        config,
      };
    } else {
      if (err instanceof AuthError) {
        const output = new OutputFormatterImpl(flags);
        output.error(err.message);
        process.exit(1);
      }
      throw err;
    }
  }

  // Route to command handler
  try {
    await routeCommand(resource, action, ctx);
  } catch (err: unknown) {
    if (err instanceof CloudflareAPIError) {
      ctx.output.error(err.format());
      process.exit(1);
    }
    if (err instanceof UsageError) {
      ctx.output.error(err.message);
      process.exit(1);
    }
    if (err instanceof AuthError) {
      ctx.output.error(err.message);
      process.exit(1);
    }
    throw err;
  }
}

async function routeCommand(
  resource: string,
  _action: string,
  ctx: Context,
): Promise<void> {
  // Build the remaining args to pass to sub-routers:
  // We need everything after the resource name from the original argv.
  const rawArgs = process.argv.slice(2);
  const resourceIdx = rawArgs.indexOf(resource);
  const subArgs = resourceIdx >= 0 ? rawArgs.slice(resourceIdx + 1) : [];

  switch (resource) {
    case "zones":
    case "zone": {
      const { run } = await import("./commands/zones/index.js");
      return run(subArgs, ctx);
    }
    case "dns": {
      const { run } = await import("./commands/dns/index.js");
      return run(subArgs, ctx);
    }
    case "workers":
    case "worker": {
      const { run } = await import("./commands/workers/index.js");
      return run(subArgs, ctx);
    }
    case "kv": {
      const { run } = await import("./commands/kv/index.js");
      return run(subArgs, ctx);
    }
    case "durable-objects":
    case "do": {
      const { run } = await import("./commands/durable-objects/index.js");
      return run(subArgs, ctx);
    }
    case "accounts":
    case "account": {
      const { run } = await import("./commands/accounts/index.js");
      return run(subArgs, ctx);
    }
    case "user":
    case "whoami": {
      const { run } = await import("./commands/user/index.js");
      return run(subArgs, ctx);
    }
    case "cache": {
      const { run } = await import("./commands/cache/index.js");
      return run(subArgs, ctx);
    }
    case "config": {
      const { run } = await import("./commands/config/index.js");
      return run(subArgs, ctx);
    }
    case "r2": {
      const { run } = await import("./commands/r2/index.js");
      return run(subArgs, ctx);
    }
    case "d1": {
      const { run } = await import("./commands/d1/index.js");
      return run(subArgs, ctx);
    }
    case "pages":
    case "page": {
      const { run } = await import("./commands/pages/index.js");
      return run(subArgs, ctx);
    }
    case "queues":
    case "queue": {
      const { run } = await import("./commands/queues/index.js");
      return run(subArgs, ctx);
    }
    case "hyperdrive": {
      const { run } = await import("./commands/hyperdrive/index.js");
      return run(subArgs, ctx);
    }
    case "pipelines":
    case "pipeline": {
      const { run } = await import("./commands/pipelines/index.js");
      return run(subArgs, ctx);
    }
    case "secrets-store": {
      const { run } = await import("./commands/secrets-store/index.js");
      return run(subArgs, ctx);
    }
    case "completion":
    case "completions": {
      const { run } = await import("./commands/completion/index.js");
      return run(subArgs, ctx);
    }
    default:
      ctx.output.error(`Unknown resource: "${resource}". Run "cf help" for available commands.`);
      process.exit(1);
  }
}

// Run
main().catch((err: unknown) => {
  process.stderr.write(
    `Fatal error: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
