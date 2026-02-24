import type { Context, PageShieldPolicy } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const id = getStringFlag(flags, "id");
  const file = getStringFlag(flags, "file");

  if (!zone) throw new UsageError("--zone <zone> is required.");
  if (!id) throw new UsageError("--id <policy-id> is required.");
  if (!file) throw new UsageError("--file <policy-json> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

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

  const policy = await ctx.client.put<PageShieldPolicy>(
    `/zones/${encodeURIComponent(zoneId)}/page_shield/policies/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Page Shield policy ${id} updated.`);
  ctx.output.detail({
    "ID": policy.id,
    "Action": policy.action,
    "Value": policy.value,
    "Description": policy.description ?? "",
    "Enabled": policy.enabled ?? true,
  });
}
