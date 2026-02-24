import type { Context, FirewallIPRule } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

const VALID_MODES = ["block", "challenge", "whitelist", "js_challenge", "managed_challenge"];

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const id = getStringFlag(flags, "id");
  const mode = getStringFlag(flags, "mode");
  const notes = getStringFlag(flags, "notes");

  if (!zone) throw new UsageError("--zone <zone> is required.");
  if (!id) throw new UsageError("--id <rule-id> is required.");
  if (!mode) throw new UsageError("--mode <mode> is required.");

  if (!VALID_MODES.includes(mode)) {
    throw new UsageError(`Invalid mode "${mode}". Valid modes: ${VALID_MODES.join(", ")}`);
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  const body: Record<string, unknown> = { mode };
  if (notes) body["notes"] = notes;

  const rule = await ctx.client.patch<FirewallIPRule>(
    `/zones/${encodeURIComponent(zoneId)}/firewall/access_rules/rules/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`IP access rule ${id} updated.`);
  ctx.output.detail({
    "ID": rule.id,
    "Mode": rule.mode,
    "Target": rule.configuration.target,
    "Value": rule.configuration.value,
  });
}
