import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as set from "./set.js";
import * as get from "./get.js";
import * as list from "./list.js";
import * as del from "./delete.js";
import * as use from "./use.js";

const USAGE = `Usage: cf config <command>

Commands:
  set       Set profile configuration
  get       Show profile details
  list      List all profiles
  delete    Delete a profile
  use       Set default profile

Run 'cf config <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "set":
      return set.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "delete":
    case "rm":
    case "remove":
      return del.run(rest, ctx);
    case "use":
    case "switch":
      return use.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown config command: "${subcommand}"\n\n${USAGE}`);
  }
}
