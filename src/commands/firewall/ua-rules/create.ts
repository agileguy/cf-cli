import type { Context, FirewallUARule } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveZoneId } from "../../../utils/zone-resolver.js";
import { UsageError } from "../../../utils/errors.js";

const VALID_MODES = ["block", "challenge", "js_challenge", "managed_challenge"];

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const ua = getStringFlag(flags, "ua");
  const mode = getStringFlag(flags, "mode");
  const description = getStringFlag(flags, "description");

  if (!zone) throw new UsageError("--zone <zone> is required.");
  if (!ua) throw new UsageError("--ua <user-agent-pattern> is required.");
  if (!mode) throw new UsageError("--mode <mode> is required.");

  if (!VALID_MODES.includes(mode)) {
    throw new UsageError(`Invalid mode "${mode}". Valid modes: ${VALID_MODES.join(", ")}`);
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  const body: Record<string, unknown> = {
    mode,
    configuration: {
      target: "ua",
      value: ua,
    },
  };

  if (description) body["description"] = description;

  const rule = await ctx.client.post<FirewallUARule>(
    `/zones/${encodeURIComponent(zoneId)}/firewall/ua_rules`,
    body,
  );

  ctx.output.success(`UA rule created: ${rule.id}`);
  ctx.output.detail({
    "ID": rule.id,
    "Mode": rule.mode,
    "UA Pattern": rule.configuration.value,
    "Description": rule.description ?? "",
  });
}
