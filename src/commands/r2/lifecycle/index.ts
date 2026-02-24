import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as get from "./get.js";
import * as set from "./set.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf r2 lifecycle <command>

Commands:
  get         Get lifecycle rules for an R2 bucket
  set         Set lifecycle rules for an R2 bucket (from JSON file)
  delete      Delete all lifecycle rules from an R2 bucket

Run 'cf r2 lifecycle <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "get":
    case "list":
    case "ls":
      return get.run(rest, ctx);
    case "set":
    case "put":
      return set.run(rest, ctx);
    case "delete":
    case "rm":
    case "remove":
      return del.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown r2 lifecycle command: "${subcommand}"\n\n${USAGE}`);
  }
}
