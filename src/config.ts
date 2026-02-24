import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync, chmodSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { Config, Profile } from "./types/index.js";

const CONFIG_DIR = join(homedir(), ".cf");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

/** Get the default empty config */
function defaultConfig(): Config {
  return {
    version: 1,
    default_profile: "default",
    profiles: {},
    defaults: {
      output: "table",
      no_color: false,
      per_page: 20,
    },
  };
}

/** Ensure config directory exists with proper permissions */
function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  } else {
    // Enforce permissions on existing directory too
    chmodSync(CONFIG_DIR, 0o700);
  }
}

/** Read configuration file. Returns default config if file doesn't exist. */
export function readConfig(): Config {
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Config;
    // Validate structure
    if (
      typeof parsed.version !== "number" ||
      typeof parsed.profiles !== "object" ||
      typeof parsed.defaults !== "object"
    ) {
      return defaultConfig();
    }
    return parsed;
  } catch {
    return defaultConfig();
  }
}

/** Write configuration file atomically with secure permissions */
export function writeConfig(config: Config): void {
  ensureConfigDir();
  const content = JSON.stringify(config, null, 2) + "\n";
  // Atomic write: write to temp file in the same directory, then rename.
  // Using the same directory avoids cross-device rename errors (EXDEV) on Linux
  // when ~/.cf/ and /tmp reside on different filesystems.
  const tmpFile = join(CONFIG_DIR, `.config.json.tmp`);
  writeFileSync(tmpFile, content, { mode: 0o600 });
  renameSync(tmpFile, CONFIG_FILE);
}

/** Get a named profile from config */
export function getProfile(
  config: Config,
  name?: string | undefined,
): Profile | null {
  const profileName = name ?? config.default_profile;
  return config.profiles[profileName] ?? null;
}

/** Set (create or update) a named profile */
export function setProfile(
  config: Config,
  name: string,
  profile: Profile,
): Config {
  return {
    ...config,
    profiles: {
      ...config.profiles,
      [name]: profile,
    },
  };
}

/** Delete a named profile */
export function deleteProfile(config: Config, name: string): Config {
  const { [name]: _removed, ...remaining } = config.profiles;
  return {
    ...config,
    profiles: remaining,
  };
}

/** Get the config directory path */
export function getConfigDir(): string {
  return CONFIG_DIR;
}

/** Get the config file path */
export function getConfigFile(): string {
  return CONFIG_FILE;
}
