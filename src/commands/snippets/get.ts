import type { Context, Snippet } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <snippet-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const snippet = await ctx.client.get<Snippet>(
    `/zones/${encodeURIComponent(zoneId)}/snippets/${encodeURIComponent(name)}`,
  );

  ctx.output.detail({
    "Name": snippet.snippet_name,
    "Main Module": snippet.main_module,
    "Created": snippet.created_on ?? "",
    "Modified": snippet.modified_on ?? "",
  });
}
