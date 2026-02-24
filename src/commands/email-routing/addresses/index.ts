import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as create from "./create.js";
import * as get from "./get.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf email-routing addresses <command>

Commands:
  list      List destination addresses
  create    Create a destination address
  get       Get a destination address
  delete    Delete a destination address

Run 'cf email-routing addresses <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "create":
    case "add":
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
      throw new UsageError(`Unknown addresses command: "${subcommand}"\n\n${USAGE}`);
  }
}
