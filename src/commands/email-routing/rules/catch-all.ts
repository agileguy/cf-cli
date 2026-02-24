import type { Context, EmailRoutingCatchAll } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

const USAGE = `Usage: cf email-routing rules catch-all <command>

Commands:
  get       Get the catch-all rule
  update    Update the catch-all rule

Run 'cf email-routing rules catch-all <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "get":
    case "show":
      return getCmd(rest, ctx);
    case "update":
      return updateCmd(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown catch-all command: "${subcommand}"\n\n${USAGE}`);
  }
}

async function getCmd(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const catchAll = await ctx.client.get<EmailRoutingCatchAll>(
    `/zones/${encodeURIComponent(zoneId)}/email/routing/rules/catch_all`,
  );

  ctx.output.detail({
    "Tag": catchAll.tag,
    "Name": catchAll.name ?? "",
    "Enabled": catchAll.enabled,
    "Matchers": JSON.stringify(catchAll.matchers),
    "Actions": JSON.stringify(catchAll.actions),
  });
}

async function updateCmd(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <catchall-json> is required.");

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

  const catchAll = await ctx.client.put<EmailRoutingCatchAll>(
    `/zones/${encodeURIComponent(zoneId)}/email/routing/rules/catch_all`,
    body,
  );

  ctx.output.success("Catch-all rule updated.");
  ctx.output.detail({
    "Tag": catchAll.tag,
    "Name": catchAll.name ?? "",
    "Enabled": catchAll.enabled,
  });
}
