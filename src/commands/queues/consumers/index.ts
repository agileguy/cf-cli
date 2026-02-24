import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as add from "./add.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf queues consumers <command>

Commands:
  list        List consumers for a queue
  add         Add a consumer to a queue
  delete      Remove a consumer from a queue

Run 'cf queues consumers <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "add":
    case "create":
      return add.run(rest, ctx);
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
      throw new UsageError(`Unknown queues consumers command: "${subcommand}"\n\n${USAGE}`);
  }
}
