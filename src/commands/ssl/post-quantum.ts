import type { Context, PostQuantumSetting } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

const USAGE = `Usage: cf ssl post-quantum <action>

Actions:
  get       Get Post-Quantum encryption setting
  update    Update Post-Quantum encryption (--value default|preferred)`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [action, ...rest] = args;

  switch (action) {
    case "get":
      return getSetting(rest, ctx);
    case "update":
      return updateSetting(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown ssl post-quantum action: "${action}"\n\n${USAGE}`);
  }
}

async function getSetting(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  const setting = await ctx.client.get<PostQuantumSetting>(
    `/zones/${encodeURIComponent(zoneId)}/cache/post_quantum_encryption`,
  );

  ctx.output.detail({
    "Value": setting.value,
    "Modified": setting.modified_on ?? "",
  });
}

async function updateSetting(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const value = getStringFlag(flags, "value");
  if (!value || (value !== "default" && value !== "preferred")) {
    throw new UsageError("--value <default|preferred> is required.");
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  const setting = await ctx.client.patch<PostQuantumSetting>(
    `/zones/${encodeURIComponent(zoneId)}/cache/post_quantum_encryption`,
    { value },
  );

  ctx.output.success(`Post-Quantum encryption set to "${setting.value}".`);
}
