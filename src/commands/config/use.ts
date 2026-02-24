import type { Context } from "../../types/index.js";
import { parseArgs } from "../../utils/args.js";
import { UsageError } from "../../utils/errors.js";
import { readConfig, writeConfig } from "../../config.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { positional } = parseArgs(args);

  const profileName = positional[0];

  if (!profileName) {
    throw new UsageError("Usage: cf config use <profile-name>");
  }

  const config = readConfig();

  if (!config.profiles[profileName]) {
    throw new UsageError(
      `Profile "${profileName}" not found. Available profiles: ${Object.keys(config.profiles).join(", ") || "(none)"}`,
    );
  }

  config.default_profile = profileName;
  writeConfig(config);

  ctx.output.success(`Default profile set to "${profileName}".`);
}
