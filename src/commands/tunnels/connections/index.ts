import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf tunnels connections <command>

Commands:
  list        List tunnel connections
  delete      Delete a tunnel connection

Run 'cf tunnels connections <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "delete":
    case "rm":
      return del.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown tunnels connections command: "${subcommand}"\n\n${USAGE}`);
  }
}
