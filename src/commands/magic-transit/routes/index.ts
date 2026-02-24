import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf magic-transit routes <command>

Commands:
  list    List static routes
  create  Create a route from JSON file
  update  Update a route from JSON file
  delete  Delete a route

Run 'cf magic-transit routes <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "create":
      return create.run(rest, ctx);
    case "update":
      return update.run(rest, ctx);
    case "delete":
    case "rm":
      return del.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown routes command: "${subcommand}"\n\n${USAGE}`);
  }
}
