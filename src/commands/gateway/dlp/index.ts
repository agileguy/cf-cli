import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as profiles from "../dlp-profiles/index.js";

const USAGE = `Usage: cf gateway dlp <command>

Commands:
  profiles    Manage DLP profiles

Run 'cf gateway dlp <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "profiles":
    case "profile":
      return profiles.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown gateway dlp command: "${subcommand}"\n\n${USAGE}`);
  }
}
