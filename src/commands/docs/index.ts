import type { Context, ColumnDef } from "../../types/index.js";
import { parseArgs, getBoolFlag } from "../../utils/args.js";
import { bold, cyan, yellow, dim } from "../../utils/colors.js";
import { UsageError } from "../../utils/errors.js";
import { readdirSync, readFileSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

export interface DocTopic {
  id: string;
  aliases: string[];
  file: string;
  title: string;
  description: string;
}

export const TOPICS: DocTopic[] = [
  {
    id: "overview",
    aliases: ["all", "index", "catalog", "resources"],
    file: "README.md",
    title: "Overview & 60-Resource Catalog",
    description: "Complete catalog of all 60 Cloudflare resources and global flags",
  },
  {
    id: "installation",
    aliases: ["install", "completions"],
    file: "getting-started/installation.md",
    title: "Installation & Completions",
    description: "npm/bun installation, source builds, and shell completions",
  },
  {
    id: "auth",
    aliases: ["authentication", "token", "profiles"],
    file: "getting-started/authentication.md",
    title: "Authentication & Profiles",
    description: "API tokens, config profiles, precedence, and verification",
  },
  {
    id: "formats",
    aliases: ["output", "json", "csv", "yaml", "scripting"],
    file: "getting-started/output-formats.md",
    title: "Output Formats & Scripting",
    description: "Table, JSON, CSV, YAML, --raw, and jq automation recipes",
  },
  {
    id: "permissions",
    aliases: ["perms", "scopes", "matrix"],
    file: "guides/permissions-matrix.md",
    title: "API Token Permissions Matrix",
    description: "Required token permission scopes per command group",
  },
  {
    id: "ci-cd",
    aliases: ["ci", "automation", "github-actions"],
    file: "guides/ci-cd-automation.md",
    title: "CI/CD & Pipeline Automation",
    description: "Automated workflows for cache purging, Workers, and D1",
  },
  {
    id: "zones",
    aliases: ["zone"],
    file: "commands/zones.md",
    title: "Zones & Settings",
    description: "Manage domain zones, settings, and traffic analytics",
  },
  {
    id: "dns",
    aliases: ["records"],
    file: "commands/dns.md",
    title: "DNS Records",
    description: "Record CRUD, proxy toggling, and BIND import/export",
  },
  {
    id: "workers",
    aliases: ["worker", "tail"],
    file: "commands/workers.md",
    title: "Workers & Serverless",
    description: "Deploy scripts, manage routes, cron triggers, and tail logs",
  },
  {
    id: "kv",
    aliases: ["storage-kv"],
    file: "commands/kv.md",
    title: "Workers KV Storage",
    description: "Key-value namespaces, key CRUD, and batch bulk operations",
  },
  {
    id: "r2",
    aliases: ["s3", "buckets"],
    file: "commands/r2.md",
    title: "R2 Object Storage",
    description: "Buckets, CORS, lifecycle retention, and custom domains",
  },
  {
    id: "d1",
    aliases: ["sql", "database"],
    file: "commands/d1.md",
    title: "D1 SQL Databases",
    description: "Serverless SQLite databases, query execution, import/export",
  },
  {
    id: "pages",
    aliases: ["jamstack"],
    file: "commands/pages.md",
    title: "Cloudflare Pages",
    description: "Projects, preview/production deployments, and domains",
  },
  {
    id: "tunnels",
    aliases: ["tunnel", "cloudflared"],
    file: "commands/tunnels.md",
    title: "Cloudflare Tunnels",
    description: "Zero Trust ingress tunnels and cloudflared run tokens",
  },
  {
    id: "rulesets",
    aliases: ["waf", "rules"],
    file: "commands/rulesets.md",
    title: "Rulesets & WAF",
    description: "Modern WAF rules, Wirefilter expressions, and phase entrypoints",
  },
  {
    id: "config",
    aliases: ["profile", "profiles-cli"],
    file: "commands/config.md",
    title: "CLI Config & Profiles",
    description: "Manage persistent authentication profiles in ~/.cf/config.json",
  },
];

/** Locate the docs/ root directory */
function findDocsDir(): string | null {
  let metaDir = "";
  try {
    if (typeof import.meta.url === "string") {
      metaDir = dirname(fileURLToPath(import.meta.url));
    }
  } catch {
    // ignore
  }

  const execDir = process.argv[1] ? dirname(resolve(process.argv[1])) : "";

  const candidates = [
    metaDir ? resolve(metaDir, "../../../docs") : "",
    metaDir ? resolve(metaDir, "../../docs") : "",
    metaDir ? resolve(metaDir, "../docs") : "",
    execDir ? resolve(execDir, "../docs") : "",
    execDir ? resolve(execDir, "docs") : "",
    resolve(process.cwd(), "docs"),
  ].filter((p): p is string => Boolean(p));

  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

/** Render Markdown with terminal ANSI styling */
export function formatMarkdownForTerminal(content: string): string {
  return content
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) {
        return "\n" + bold(cyan("  " + line.slice(2).toUpperCase())) + "\n";
      }
      if (line.startsWith("## ")) {
        return "\n" + bold(yellow("── " + line.slice(3).toUpperCase() + " ")) + "\n";
      }
      if (line.startsWith("### ")) {
        return "\n" + bold("• " + line.slice(4));
      }
      if (line.startsWith("#### ")) {
        return bold(dim("  " + line.slice(5)));
      }
      if (line.startsWith("```")) {
        return dim("  " + "─".repeat(50));
      }
      if (line.startsWith("> ")) {
        return dim("  │ ") + line.slice(2);
      }
      if (line.startsWith("---")) {
        return dim("─".repeat(60));
      }

      // Inline codes, bolds, and links
      return line
        .replace(/`([^`]+)`/g, (_m, c) => cyan(c))
        .replace(/\*\*([^*]+)\*\*/g, (_m, b) => bold(b))
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => `${text} (${dim(url)})`);
    })
    .join("\n");
}

/** Decide whether the pager should be disabled for this invocation. */
export function shouldDisablePager(flags: Record<string, string | boolean>, quiet: boolean | undefined): boolean {
  return getBoolFlag(flags, "noPager") || flags["pager"] === false || Boolean(quiet);
}

/** Split a $PAGER value into its command and arguments (e.g. "less -R"). */
export function splitPagerCommand(pagerCmd: string): { bin: string; args: string[] } {
  const [bin, ...args] = pagerCmd.trim().split(/\s+/);
  return { bin: bin || "less", args };
}

/** Output with $PAGER or direct stdout */
export function displayOutput(text: string, noPager: boolean): Promise<void> {
  if (noPager || !process.stdout.isTTY) {
    process.stdout.write(text + "\n");
    return Promise.resolve();
  }

  const { bin, args: pagerCmdArgs } = splitPagerCommand(process.env["PAGER"] || "less");
  const pagerArgs = bin.includes("less") && !pagerCmdArgs.includes("-R") ? [...pagerCmdArgs, "-R"] : pagerCmdArgs;

  return new Promise((resolve) => {
    let settled = false;
    const fallback = (): void => {
      if (settled) return;
      settled = true;
      process.stdout.write(text + "\n");
      resolve();
    };

    try {
      const child = spawn(bin, pagerArgs, {
        stdio: ["pipe", "inherit", "inherit"],
      });

      // spawn() reports a missing binary asynchronously via 'error', not a
      // synchronous throw, so this is what the try/catch below can't catch.
      child.on("error", fallback);
      child.on("exit", () => {
        if (settled) return;
        settled = true;
        resolve();
      });
      // Quitting the pager before all output is written closes its end of
      // the pipe; without this, that surfaces as an unhandled EPIPE.
      child.stdin.on("error", () => {});
      child.stdin.write(text + "\n");
      child.stdin.end();
    } catch {
      fallback();
    }
  });
}

/** Search across all docs files */
function searchDocs(query: string, docsDir: string, ctx: Context): void {
  const q = query.toLowerCase();
  const results: { topic: string; section: string; snippet: string }[] = [];

  for (const topic of TOPICS) {
    const fullPath = join(docsDir, topic.file);
    if (!existsSync(fullPath)) continue;

    const content = readFileSync(fullPath, "utf8");
    const lines = content.split("\n");
    let currentSection = topic.title;

    for (const line of lines) {
      if (line.startsWith("## ") || line.startsWith("### ")) {
        currentSection = line.replace(/^#+\s+/, "");
      }
      if (line.toLowerCase().includes(q)) {
        results.push({
          topic: topic.id,
          section: currentSection,
          snippet: line.trim(),
        });
      }
    }
  }

  if (results.length === 0) {
    ctx.output.info(`No documentation matches found for "${query}".`);
    return;
  }

  ctx.output.info(`Found ${results.length} match(es) for "${query}":\n`);
  for (const r of results.slice(0, 15)) {
    process.stdout.write(
      `  ${bold(cyan(r.topic))} ${dim("›")} ${yellow(r.section)}\n    ${r.snippet}\n\n`,
    );
  }

  ctx.output.info(`Run 'cf docs <topic>' to view the full document.`);
}

export async function run(args: string[], ctx: Context): Promise<void> {
  const { positional, flags } = parseArgs(args);
  const noPager = shouldDisablePager(flags, ctx.flags.quiet);
  const docsDir = findDocsDir();

  const command = positional[0]?.toLowerCase();

  // Search mode
  if (command === "search" || command === "find") {
    const query = positional.slice(1).join(" ") || (flags["query"] as string);
    if (!query) {
      throw new UsageError("Search query required: cf docs search <query>");
    }
    if (!docsDir) {
      throw new UsageError("Documentation files directory could not be located.");
    }
    searchDocs(query, docsDir, ctx);
    return;
  }

  // Topic lookup
  if (command && command !== "list") {
    const topic = TOPICS.find(
      (t) => t.id === command || t.aliases.includes(command),
    );

    if (!topic) {
      ctx.output.warn(`Unknown documentation topic: "${command}".\n`);
      printTopicList(ctx);
      return;
    }

    if (!docsDir) {
      throw new UsageError("Documentation files directory could not be located.");
    }

    const filePath = join(docsDir, topic.file);
    if (!existsSync(filePath)) {
      throw new UsageError(`Documentation file not found: ${topic.file}`);
    }

    const content = readFileSync(filePath, "utf8");
    const formatted = formatMarkdownForTerminal(content);
    await displayOutput(formatted, noPager);
    return;
  }

  // Default: Print Topic Index
  printTopicList(ctx);
}

function printTopicList(ctx: Context): void {
  process.stdout.write(`\n${bold(cyan("Cloudflare CLI (`cf`) Documentation"))}\n\n`);
  process.stdout.write(`USAGE:\n  cf docs <topic>\n  cf docs search <query>\n\nTOPICS:\n`);

  const rows = TOPICS.map((t) => ({
    topic: t.id,
    title: t.title,
    description: t.description,
  }));

  const columns: ColumnDef[] = [
    { key: "topic", header: "Topic", width: 14 },
    { key: "title", header: "Title", width: 28 },
    { key: "description", header: "Description", width: 50 },
  ];

  ctx.output.table(rows, columns);
  process.stdout.write(`\nTip: Run 'cf docs <topic>' (e.g. ${cyan("cf docs dns")}) or 'cf docs search <term>'.\n\n`);
}
