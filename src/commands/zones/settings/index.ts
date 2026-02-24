import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as update from "./update.js";

const USAGE = `Usage: cf zones settings <command>

Commands:
  list      List all zone settings
  get       Get a specific zone setting
  update    Update a zone setting

Run 'cf zones settings <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "update":
    case "set":
    case "edit":
      return update.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown settings command: "${subcommand}"\n\n${USAGE}`);
  }
}
