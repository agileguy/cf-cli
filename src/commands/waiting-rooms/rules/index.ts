import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as upsert from "./upsert.js";

const USAGE = `Usage: cf waiting-rooms rules <command>

Commands:
  list        List waiting room rules
  upsert      Create or replace waiting room rules

Run 'cf waiting-rooms rules <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "upsert":
    case "set":
      return upsert.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown waiting-rooms rules command: "${subcommand}"\n\n${USAGE}`);
  }
}
