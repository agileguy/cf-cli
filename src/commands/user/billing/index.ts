import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as profile from "./profile.js";
import * as history from "./history.js";

const USAGE = `Usage: cf user billing <command>

Commands:
  profile   Get billing profile
  history   List billing history

Run 'cf user billing <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "profile":
      return profile.run(rest, ctx);
    case "history":
      return history.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown billing command: "${subcommand}"\n\n${USAGE}`);
  }
}
