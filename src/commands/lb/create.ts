import type { Context, LoadBalancer } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <lb-json> is required.");

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

  const lb = await ctx.client.post<LoadBalancer>(
    `/zones/${encodeURIComponent(zoneId)}/load_balancers`,
    body,
  );

  ctx.output.success(`Load balancer created: ${lb.id}`);
  ctx.output.detail({
    "ID": lb.id,
    "Name": lb.name,
    "Enabled": lb.enabled ?? false,
  });
}
