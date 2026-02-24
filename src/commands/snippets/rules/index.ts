import type { Context, SnippetRule, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

const USAGE = `Usage: cf snippets rules <command>

Commands:
  list      List snippet rules
  upsert    Create or update snippet rules

Run 'cf snippets rules <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return listCmd(rest, ctx);
    case "upsert":
    case "update":
      return upsertCmd(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown rules command: "${subcommand}"\n\n${USAGE}`);
  }
}

async function listCmd(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const rules = await ctx.client.get<SnippetRule[]>(
    `/zones/${encodeURIComponent(zoneId)}/snippets/snippet_rules`,
  );

  const columns: ColumnDef[] = [
    { key: "snippet_name", header: "Snippet Name", width: 30 },
    { key: "expression", header: "Expression", width: 50 },
    { key: "description", header: "Description", width: 30 },
    { key: "enabled", header: "Enabled", width: 10 },
  ];

  ctx.output.table(rules, columns);
}

async function upsertCmd(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <rules-json> is required.");

  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  let body: unknown;
  try {
    body = JSON.parse(content);
  } catch {
    throw new UsageError("File must contain valid JSON.");
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  await ctx.client.put<SnippetRule[]>(
    `/zones/${encodeURIComponent(zoneId)}/snippets/snippet_rules`,
    body,
  );

  ctx.output.success("Snippet rules updated.");
}
