import type { Context, Healthcheck } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <hc-json> is required.");

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

  const hc = await ctx.client.post<Healthcheck>(
    `/zones/${encodeURIComponent(zoneId)}/healthchecks`,
    body,
  );

  ctx.output.success(`Healthcheck created: ${hc.id}`);
  ctx.output.detail({
    "ID": hc.id,
    "Name": hc.name,
    "Address": hc.address,
    "Status": hc.status ?? "",
  });
}
