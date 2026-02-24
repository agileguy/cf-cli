import type { Context, CachePurgeResult } from "../../types/index.js";
import { parseArgs, getStringFlag, getBoolFlag, getListFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";
import { confirm } from "../../utils/prompts.js";

const MAX_URLS = 30;

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const everything = getBoolFlag(flags, "everything");
  const urls = getListFlag(flags, "urls");
  const tags = getListFlag(flags, "tags");
  const hosts = getListFlag(flags, "hosts");
  const prefixes = getListFlag(flags, "prefixes");

  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  // Validate mutually exclusive flags
  const optionCount = [everything, urls, tags, hosts, prefixes].filter(Boolean).length;
  if (optionCount === 0) {
    throw new UsageError(
      "Specify one of: --everything, --urls, --tags, --hosts, --prefixes",
    );
  }
  if (optionCount > 1) {
    throw new UsageError(
      "--everything, --urls, --tags, --hosts, and --prefixes are mutually exclusive.",
    );
  }

  // Validate URL count
  if (urls && urls.length > MAX_URLS) {
    throw new UsageError(
      `Maximum ${MAX_URLS} URLs per purge request. Got ${urls.length}.`,
    );
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  // Require confirmation for purge everything
  if (everything) {
    const confirmed = await confirm(
      `Purge ALL cached content for zone ${zoneId}? This affects all visitors.`,
      ctx.flags,
    );
    if (!confirmed) {
      ctx.output.info("Aborted.");
      return;
    }
  }

  const body: Record<string, unknown> = {};
  if (everything) body["purge_everything"] = true;
  if (urls) body["files"] = urls;
  if (tags) body["tags"] = tags;
  if (hosts) body["hosts"] = hosts;
  if (prefixes) body["prefixes"] = prefixes;

  const result = await ctx.client.post<CachePurgeResult>(
    `/zones/${zoneId}/purge_cache`,
    body,
  );

  ctx.output.success(`Cache purge initiated: ${result.id}`);
}
