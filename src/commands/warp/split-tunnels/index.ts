import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as add from "./add.js";
import * as remove from "./remove.js";

const USAGE = `Usage: cf warp split-tunnels <command>

Commands:
  list        List split tunnel entries
  add         Add a split tunnel entry
  remove      Remove a split tunnel entry

Run 'cf warp split-tunnels <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "add":
      return add.run(rest, ctx);
    case "remove":
    case "rm":
      return remove.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown warp split-tunnels command: "${subcommand}"\n\n${USAGE}`);
  }
}
