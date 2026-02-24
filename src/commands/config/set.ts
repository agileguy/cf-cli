import type { Context, Profile } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { UsageError } from "../../utils/errors.js";
import { readConfig, writeConfig, setProfile } from "../../config.js";
import { validateOutputFormat } from "../../utils/validators.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const profileName = getStringFlag(flags, "profile");
  const token = getStringFlag(flags, "token");
  const apiKey = getStringFlag(flags, "apiKey");
  const email = getStringFlag(flags, "email");
  const accountId = getStringFlag(flags, "accountId");
  const zoneId = getStringFlag(flags, "zoneId");
  const output = getStringFlag(flags, "output");

  if (!profileName) {
    throw new UsageError("--profile <name> is required.");
  }

  // Validate profile name: alphanumeric + hyphens only, reject prototype-polluting keys
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(profileName)) {
    throw new UsageError(
      `Invalid profile name: "${profileName}". Profile names must start with a letter or digit and contain only alphanumeric characters and hyphens.`,
    );
  }
  const RESERVED_KEYS = new Set(["__proto__", "constructor", "prototype"]);
  if (RESERVED_KEYS.has(profileName)) {
    throw new UsageError(`Invalid profile name: "${profileName}". That name is reserved.`);
  }

  // Determine auth method
  let authMethod: "token" | "key";
  if (token) {
    authMethod = "token";
  } else if (apiKey && email) {
    authMethod = "key";
  } else if (apiKey && !email) {
    throw new UsageError("--email is required when using --api-key.");
  } else {
    // Check if profile already exists and has auth method
    const config = readConfig();
    const existing = config.profiles[profileName];
    if (existing) {
      authMethod = existing.auth_method;
    } else {
      throw new UsageError("New profile requires either --token or --api-key + --email.");
    }
  }

  if (output) {
    validateOutputFormat(output);
  }

  let config = readConfig();

  // Merge with existing profile data if it exists
  const existing = config.profiles[profileName];
  const profile: Profile = {
    auth_method: authMethod,
    token: token ?? existing?.token,
    api_key: apiKey ?? existing?.api_key,
    email: email ?? existing?.email,
    account_id: accountId ?? existing?.account_id,
    zone_id: zoneId ?? existing?.zone_id,
  };

  config = setProfile(config, profileName, profile);
  writeConfig(config);

  ctx.output.success(`Profile "${profileName}" saved.`);
}
