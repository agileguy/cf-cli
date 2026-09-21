#!/usr/bin/env bun
/**
 * Zero-dependency Markdown to Roff (Man Page Section 1) Converter for cf-cli.
 * Converts docs in docs/ to man/man1/ files.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve } from "path";

const VERSION = "1.1.2";
const DATE = "September 2026";
const ROOT = resolve(import.meta.dir, "..");
const DOCS_DIR = join(ROOT, "docs");
const MAN_DIR = join(ROOT, "man", "man1");

interface DocMapping {
  src: string;
  manName: string;
  title: string;
  description: string;
}

const MAPPINGS: DocMapping[] = [
  {
    src: join(DOCS_DIR, "README.md"),
    manName: "cf.1",
    title: "CF",
    description: "Cloudflare CLI wrapping the entire Cloudflare REST API",
  },
  {
    src: join(DOCS_DIR, "getting-started", "installation.md"),
    manName: "cf-installation.1",
    title: "CF-INSTALLATION",
    description: "Installation and shell completion guide for cf",
  },
  {
    src: join(DOCS_DIR, "getting-started", "authentication.md"),
    manName: "cf-auth.1",
    title: "CF-AUTH",
    description: "Authentication methods, API tokens, and profiles for cf",
  },
  {
    src: join(DOCS_DIR, "getting-started", "output-formats.md"),
    manName: "cf-formats.1",
    title: "CF-FORMATS",
    description: "Output formats, color support, and automation scripting for cf",
  },
  {
    src: join(DOCS_DIR, "guides", "permissions-matrix.md"),
    manName: "cf-permissions.1",
    title: "CF-PERMISSIONS",
    description: "Cloudflare API token permissions required per resource",
  },
  {
    src: join(DOCS_DIR, "guides", "ci-cd-automation.md"),
    manName: "cf-ci-cd.1",
    title: "CF-CI-CD",
    description: "CI/CD and pipeline automation recipes with cf",
  },
  {
    src: join(DOCS_DIR, "commands", "zones.md"),
    manName: "cf-zones.1",
    title: "CF-ZONES",
    description: "Manage Cloudflare domain zones, settings, and analytics",
  },
  {
    src: join(DOCS_DIR, "commands", "dns.md"),
    manName: "cf-dns.1",
    title: "CF-DNS",
    description: "Manage DNS records, BIND import, and export",
  },
  {
    src: join(DOCS_DIR, "commands", "workers.md"),
    manName: "cf-workers.1",
    title: "CF-WORKERS",
    description: "Manage serverless Workers scripts, routes, cron triggers, and tail logs",
  },
  {
    src: join(DOCS_DIR, "commands", "kv.md"),
    manName: "cf-kv.1",
    title: "CF-KV",
    description: "Manage Workers KV key-value storage namespaces and keys",
  },
  {
    src: join(DOCS_DIR, "commands", "r2.md"),
    manName: "cf-r2.1",
    title: "CF-R2",
    description: "Manage R2 object storage buckets, CORS, lifecycle, and domains",
  },
  {
    src: join(DOCS_DIR, "commands", "d1.md"),
    manName: "cf-d1.1",
    title: "CF-D1",
    description: "Manage D1 SQL databases, execute queries, and import/export dumps",
  },
  {
    src: join(DOCS_DIR, "commands", "pages.md"),
    manName: "cf-pages.1",
    title: "CF-PAGES",
    description: "Manage Cloudflare Pages projects, deployments, and custom domains",
  },
  {
    src: join(DOCS_DIR, "commands", "tunnels.md"),
    manName: "cf-tunnels.1",
    title: "CF-TUNNELS",
    description: "Manage Cloudflare Zero Trust Tunnels and cloudflared tokens",
  },
  {
    src: join(DOCS_DIR, "commands", "rulesets.md"),
    manName: "cf-rulesets.1",
    title: "CF-RULESETS",
    description: "Manage Cloudflare Rulesets, WAF rules, and phase entry points",
  },
  {
    src: join(DOCS_DIR, "commands", "config.md"),
    manName: "cf-config.1",
    title: "CF-CONFIG",
    description: "Manage persistent CLI authentication profiles and defaults",
  },
];

/** Convert markdown inline styles to roff formatting */
function formatInline(text: string): string {
  let res = text;

  // Escape lone backslashes
  res = res.replace(/\\/g, "\\\\");

  // Markdown links: [text](url) -> text (url)
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");

  // Code spans `code` -> \fBcode\fR
  res = res.replace(/`([^`]+)`/g, "\\fB$1\\fR");

  // Bold **bold** -> \fBbold\fR
  res = res.replace(/\*\*([^*]+)\*\*/g, "\\fB$1\\fR");

  // Italic *italic* or _italic_ -> \fIitalic\fR
  res = res.replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, "$1\\fI$2\\fR$3");
  res = res.replace(/(^|[^_])_([^_]+)_([^_]|$)/g, "$1\\fI$2\\fR$3");

  // Escape leading dots or hyphens
  if (res.startsWith(".")) res = "\\&" + res;
  if (res.startsWith("-")) res = "\\-" + res.slice(1);

  return res;
}

/** Converts a Markdown table into formatted roff text */
function renderTable(tableLines: string[]): string[] {
  if (tableLines.length < 2) return [];

  const parseRow = (line: string): string[] =>
    line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim());

  const headers = parseRow(tableLines[0] ?? "");
  const rows = tableLines.slice(2).map(parseRow);

  const out: string[] = [".PP", ".RS 2"];

  for (const row of rows) {
    if (row.length === 0 || row.every((c) => !c)) continue;
    const firstCol = formatInline(row[0] ?? "");
    const rest = row
      .slice(1)
      .map((col, idx) => {
        const header = headers[idx + 1] ?? "";
        return header ? `\\fI${header}:\\fR ${formatInline(col)}` : formatInline(col);
      })
      .filter(Boolean)
      .join(" | ");

    out.push(`.TP\n${firstCol}\n${rest}`);
  }

  out.push(".RE", ".PP");
  return out;
}

/** Convert markdown string to roff man page */
function markdownToRoff(md: string, mapping: DocMapping): string {
  const lines = md.split("\n");
  const roff: string[] = [];

  // Title header
  roff.push(
    `.TH ${mapping.title} 1 "${DATE}" "cf-cli v${VERSION}" "Cloudflare CLI Manual"`,
  );
  roff.push(".SH NAME");
  roff.push(
    `${mapping.manName.replace(/\\.1$/, "")} \\- ${mapping.description}`,
  );

  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let inTable = false;
  let tableBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!;
    const trimmed = rawLine.trim();

    // Code block toggle
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        roff.push(".PP");
        roff.push(".nf");
        roff.push(".ft CW");
        for (const c of codeBuffer) {
          roff.push(c.startsWith(".") ? "\\&" + c : c);
        }
        roff.push(".ft");
        roff.push(".fi");
        roff.push(".PP");
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Markdown Table handling
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      tableBuffer.push(trimmed);
      continue;
    } else if (inTable) {
      inTable = false;
      roff.push(...renderTable(tableBuffer));
      tableBuffer = [];
    }

    // Ignore horizontal rules and HTML comments
    if (trimmed === "---" || trimmed === "***" || trimmed.startsWith("<!--")) {
      continue;
    }

    // Skip root H1 (already covered by .TH and .SH NAME)
    if (trimmed.startsWith("# ")) {
      continue;
    }

    // Section header (H2)
    if (trimmed.startsWith("## ")) {
      const heading = trimmed.slice(3).trim();
      roff.push(`.SH ${formatInline(heading.toUpperCase())}`);
      continue;
    }

    // Subsection header (H3)
    if (trimmed.startsWith("### ")) {
      const heading = trimmed.slice(4).trim();
      roff.push(`.SS "${formatInline(heading)}"`);
      continue;
    }

    // Sub-sub header (H4)
    if (trimmed.startsWith("#### ")) {
      const heading = trimmed.slice(5).trim();
      roff.push(`.PP\n\\fB${formatInline(heading)}\\fR\n.PP`);
      continue;
    }

    // Bullet lists
    if (/^[*+-]\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^[*+-]\s+/, "");
      roff.push(`.IP \\(bu 2\n${formatInline(itemText)}`);
      continue;
    }

    // Numbered lists
    if (/^\d+\.\s+/.test(trimmed)) {
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        roff.push(`.IP ${numMatch[1]}. 3\n${formatInline(numMatch[2]!)}`);
        continue;
      }
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const quoteText = trimmed.replace(/^>\s*/, "");
      roff.push(`.RS 2\n${formatInline(quoteText)}\n.RE`);
      continue;
    }

    // Empty lines
    if (trimmed === "") {
      roff.push(".PP");
      continue;
    }

    // Regular paragraph text
    roff.push(formatInline(rawLine));
  }

  // Flush any leftover table or code block
  if (inTable) {
    roff.push(...renderTable(tableBuffer));
  }
  if (inCodeBlock) {
    roff.push(".PP", ".nf", ".ft CW", ...codeBuffer, ".ft", ".fi", ".PP");
  }

  // Standard Footer: SEE ALSO & AUTHORS
  roff.push(".SH SEE ALSO");
  roff.push(
    "\\fBcf\\fR(1), \\fBcf-dns\\fR(1), \\fBcf-zones\\fR(1), \\fBcf-workers\\fR(1), \\fBcf-kv\\fR(1), \\fBcf-r2\\fR(1), \\fBcf-d1\\fR(1)",
  );
  roff.push(".SH AUTHORS");
  roff.push("Built for Cloudflare API management by agileguy.");

  return roff.join("\n") + "\n";
}

function main() {
  if (!existsSync(MAN_DIR)) {
    mkdirSync(MAN_DIR, { recursive: true });
  }

  console.log(`Generating man pages in ${MAN_DIR}...`);

  for (const mapping of MAPPINGS) {
    if (!existsSync(mapping.src)) {
      console.warn(`Warning: source file not found: ${mapping.src}`);
      continue;
    }

    const md = readFileSync(mapping.src, "utf8");
    const roff = markdownToRoff(md, mapping);
    const dest = join(MAN_DIR, mapping.manName);

    writeFileSync(dest, roff, "utf8");
    console.log(`✓ Generated ${mapping.manName}`);
  }

  console.log(`Successfully generated ${MAPPINGS.length} man pages.`);
}

main();
