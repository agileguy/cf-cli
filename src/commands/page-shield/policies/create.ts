import type { Context, PageShieldPolicy } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const file = getStringFlag(flags, "file");

  if (!zone) throw new UsageError("--zone <zone> is required.");
  if (!file) throw new UsageError("--file <policy-json> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch {
    throw new UsageError(`Could not read file: ${file}`);
  }

  let body: unknown;
  try {
    body = JSON.parse(content);
  } catch {
    throw new UsageError("File must contain valid JSON.");
  }

  const policy = await ctx.client.post<PageShieldPolicy>(
    `/zones/${encodeURIComponent(zoneId)}/page_shield/policies`,
    body,
  );

  ctx.output.success(`Page Shield policy created: ${policy.id}`);
  ctx.output.detail({
    "ID": policy.id,
    "Action": policy.action,
    "Value": policy.value,
    "Description": policy.description ?? "",
    "Enabled": policy.enabled ?? true,
  });
}
