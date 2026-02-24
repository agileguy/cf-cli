import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { UsageError } from "../../utils/errors.js";
import { readConfig, writeConfig, deleteProfile } from "../../config.js";
import { confirm } from "../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const profileName = getStringFlag(flags, "profile");

  if (!profileName) {
    throw new UsageError("--profile <name> is required.");
  }

  const config = readConfig();

  if (!config.profiles[profileName]) {
    throw new UsageError(
      `Profile "${profileName}" not found. Available profiles: ${Object.keys(config.profiles).join(", ") || "(none)"}`,
    );
  }

  const confirmed = await confirm(
    `Delete profile "${profileName}"?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  const updated = deleteProfile(config, profileName);

  // If we deleted the default profile, reset default
  if (profileName === config.default_profile) {
    const remaining = Object.keys(updated.profiles);
    updated.default_profile = remaining[0] ?? "default";
  }

  writeConfig(updated);

  ctx.output.success(`Profile "${profileName}" deleted.`);
}
