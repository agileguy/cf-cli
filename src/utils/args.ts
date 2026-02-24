/**
 * Zero-dependency argument parser for CLI commands.
 *
 * Supports:
 *   --flag value
 *   --flag=value
 *   --bool-flag  (boolean true)
 *   --no-flag    (boolean false for --flag)
 *   positional arguments
 */

export interface ParsedArgs {
  flags: Record<string, string | boolean>;
  positional: string[];
}

export function parseArgs(args: string[]): ParsedArgs {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];

  let i = 0;
  while (i < args.length) {
    const arg = args[i]!;

    if (arg === "--") {
      // Everything after -- is positional
      positional.push(...args.slice(i + 1));
      break;
    }

    if (arg.startsWith("--")) {
      const withoutDashes = arg.slice(2);

      // Handle --flag=value
      const eqIndex = withoutDashes.indexOf("=");
      if (eqIndex !== -1) {
        const key = normalizeKey(withoutDashes.slice(0, eqIndex));
        flags[key] = withoutDashes.slice(eqIndex + 1);
        i++;
        continue;
      }

      // Handle --no-<flag> as boolean false
      if (withoutDashes.startsWith("no-")) {
        const key = normalizeKey(withoutDashes.slice(3));
        flags[key] = false;
        i++;
        continue;
      }

      const key = normalizeKey(withoutDashes);

      // Check if next arg is a value (not a flag)
      const nextArg = args[i + 1];
      if (nextArg !== undefined && !nextArg.startsWith("-")) {
        flags[key] = nextArg;
        i += 2;
        continue;
      }

      // Boolean flag
      flags[key] = true;
      i++;
      continue;
    }

    if (arg.startsWith("-") && arg.length === 2) {
      // Short flag: -f value or -f (boolean)
      const key = arg.slice(1);
      const nextArg = args[i + 1];
      if (nextArg !== undefined && !nextArg.startsWith("-")) {
        flags[key] = nextArg;
        i += 2;
        continue;
      }
      flags[key] = true;
      i++;
      continue;
    }

    // Positional argument
    positional.push(arg);
    i++;
  }

  return { flags, positional };
}

/** Normalize a flag key: kebab-case to camelCase */
function normalizeKey(key: string): string {
  return key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** Get a string flag value, or undefined if not set or boolean */
export function getStringFlag(flags: Record<string, string | boolean>, key: string): string | undefined {
  const val = flags[key];
  if (typeof val === "string") return val;
  return undefined;
}

/** Get a boolean flag value (true if present, false if --no-* or absent) */
export function getBoolFlag(flags: Record<string, string | boolean>, key: string): boolean {
  const val = flags[key];
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val !== "" && val !== "0" && val !== "false";
  return false;
}

/** Get a numeric flag value */
export function getNumberFlag(flags: Record<string, string | boolean>, key: string): number | undefined {
  const val = flags[key];
  if (typeof val === "string") {
    const num = parseInt(val, 10);
    if (!isNaN(num)) return num;
  }
  return undefined;
}

/** Get a comma-separated list flag as array */
export function getListFlag(flags: Record<string, string | boolean>, key: string): string[] | undefined {
  const val = flags[key];
  if (typeof val === "string") {
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return undefined;
}
