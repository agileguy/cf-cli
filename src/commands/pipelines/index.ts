import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf pipelines <command>

Commands:
  list        List pipelines
  get         Get pipeline details
  create      Create a pipeline from a config file
  delete      Delete a pipeline

Run 'cf pipelines <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "create":
    case "new":
      return create.run(rest, ctx);
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
      throw new UsageError(`Unknown pipelines command: "${subcommand}"\n\n${USAGE}`);
  }
}
