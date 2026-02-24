import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as get from "./get.js";
import * as update from "./update.js";

const USAGE = `Usage: cf cache-reserve <command>

Commands:
  get       Get Cache Reserve status
  update    Enable or disable Cache Reserve

Run 'cf cache-reserve <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "update":
    case "set":
      return update.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown cache-reserve command: "${subcommand}"\n\n${USAGE}`);
  }
}
