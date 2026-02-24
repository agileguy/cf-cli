import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as create from "./create.js";
import * as get from "./get.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf observatory tests <command>

Commands:
  list        List tests for a URL
  create      Create a new speed test
  get         Get test details
  delete      Delete tests for a URL

Run 'cf observatory tests <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "create":
      return create.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "delete":
    case "rm":
      return del.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown observatory tests command: "${subcommand}"\n\n${USAGE}`);
  }
}
