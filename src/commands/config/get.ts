import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { readConfig, getProfile } from "../../config.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const profileName = getStringFlag(flags, "profile");
  const config = readConfig();

  const name = profileName ?? config.default_profile;
  const profile = getProfile(config, name);

  if (!profile) {
    throw new UsageError(
      `Profile "${name}" not found. Available profiles: ${Object.keys(config.profiles).join(", ") || "(none)"}`,
    );
  }

  // Redact sensitive values
  const redactedToken = profile.token
    ? `***${profile.token.slice(-4)}`
    : "-";
  const redactedApiKey = profile.api_key
    ? `***${profile.api_key.slice(-4)}`
    : "-";

  ctx.output.detail({
    "Profile": name,
    "Auth Method": profile.auth_method,
    "Token": redactedToken,
    "API Key": redactedApiKey,
    "Email": profile.email ?? "-",
    "Account ID": profile.account_id ?? "-",
    "Zone ID": profile.zone_id ?? "-",
    "Is Default": name === config.default_profile,
  });
}
