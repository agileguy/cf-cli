import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const url = getStringFlag(flags, "url");
  if (!url) throw new UsageError("--url <page-url> is required.");

  const region = getStringFlag(flags, "region");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const confirmed = await confirm(
    `Delete all tests for "${url}"${region ? ` in region "${region}"` : ""}?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  const params: Record<string, string> = {};
  if (region) params["region"] = region;

  await ctx.client.delete<void>(
    `/zones/${encodeURIComponent(zoneId)}/speed_api/pages/${encodeURIComponent(url)}/tests`,
    params,
  );

  ctx.output.success(`Tests for "${url}" deleted.`);
}
