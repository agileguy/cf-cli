import type { Config } from "./types/index.js";
import { getProfile, readConfig } from "./config.js";
import { AuthError } from "./utils/errors.js";

export interface Credentials {
  method: "token" | "key";
  token?: string | undefined;
  apiKey?: string | undefined;
  email?: string | undefined;
}

/**
 * Resolve authentication credentials.
 *
 * Resolution order:
 * 1. --profile flag (explicit profile name)
 * 2. CF_PROFILE env (profile name from env)
 * 3. CF_API_TOKEN env (direct token)
 * 4. CF_API_KEY + CF_API_EMAIL env (direct key pair)
 * 5. "default" profile from config file
 * 6. Error
 */
export function loadCredentials(
  profile?: string | undefined,
  config?: Config | undefined,
): Credentials {
  const cfg = config ?? readConfig();

  // 1. Explicit --profile flag
  if (profile) {
    const p = getProfile(cfg, profile);
    if (!p) {
      throw new AuthError(
        `Profile "${profile}" not found. Available profiles: ${Object.keys(cfg.profiles).join(", ") || "(none)"}`,
      );
    }
    return profileToCredentials(p, profile);
  }

  // 2. CF_PROFILE env var
  const envProfile = process.env["CF_PROFILE"];
  if (envProfile) {
    const p = getProfile(cfg, envProfile);
    if (!p) {
      throw new AuthError(
        `Profile "${envProfile}" (from CF_PROFILE) not found. Available profiles: ${Object.keys(cfg.profiles).join(", ") || "(none)"}`,
      );
    }
    return profileToCredentials(p, envProfile);
  }

  // 3. CF_API_TOKEN / CLOUDFLARE_API_TOKEN env (direct)
  const envToken = process.env["CF_API_TOKEN"] ?? process.env["CLOUDFLARE_API_TOKEN"];
  if (envToken) {
    return { method: "token", token: envToken };
  }

  // 4. CF_API_KEY + CF_API_EMAIL env (direct)
  const envKey = process.env["CF_API_KEY"];
  const envEmail = process.env["CF_API_EMAIL"];
  if (envKey && envEmail) {
    return { method: "key", apiKey: envKey, email: envEmail };
  }
  if (envKey && !envEmail) {
    throw new AuthError(
      "CF_API_KEY is set but CF_API_EMAIL is missing. Both are required for API key auth.",
    );
  }

  // 5. Default profile from config
  const defaultProfile = getProfile(cfg);
  if (defaultProfile) {
    return profileToCredentials(defaultProfile, cfg.default_profile);
  }

  // 6. No credentials found
  throw new AuthError(
    "No authentication credentials found.\n" +
      "Set up credentials using one of:\n" +
      "  - cf config set-profile (interactive)\n" +
      "  - CF_API_TOKEN environment variable\n" +
      "  - CF_API_KEY + CF_API_EMAIL environment variables",
  );
}

function profileToCredentials(
  profile: { auth_method: "token" | "key"; token?: string | undefined; api_key?: string | undefined; email?: string | undefined },
  profileName: string,
): Credentials {
  if (profile.auth_method === "token") {
    if (!profile.token) {
      throw new AuthError(
        `Profile "${profileName}" is configured for token auth but has no token.`,
      );
    }
    return { method: "token", token: profile.token };
  }

  if (profile.auth_method === "key") {
    if (!profile.api_key || !profile.email) {
      throw new AuthError(
        `Profile "${profileName}" is configured for key auth but is missing api_key or email.`,
      );
    }
    return { method: "key", apiKey: profile.api_key, email: profile.email };
  }

  throw new AuthError(
    `Profile "${profileName}" has invalid auth_method: "${profile.auth_method}"`,
  );
}
