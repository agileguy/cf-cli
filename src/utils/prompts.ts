import type { GlobalFlags } from "../types/index.js";
import { yellow, bold, dim } from "./colors.js";

/**
 * Prompt user for confirmation before destructive operations.
 * Returns true if --yes or --quiet flags are set.
 * Otherwise prompts stdin; default is N (safe).
 */
export async function confirm(
  message: string,
  flags: GlobalFlags,
): Promise<boolean> {
  // Auto-confirm if --yes or --quiet
  if (flags.yes || flags.quiet) return true;

  // If not a TTY, default to false (safe)
  if (!process.stdin.isTTY) return false;

  const prompt = `${yellow(bold("?"))} ${message} ${dim("[y/N]")} `;
  process.stdout.write(prompt);

  return new Promise<boolean>((resolve) => {
    const onData = (data: Buffer): void => {
      const input = data.toString().trim().toLowerCase();
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode?.(false);
      process.stdin.pause();
      resolve(input === "y" || input === "yes");
    };

    process.stdin.setRawMode?.(false);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", onData);
  });
}
