import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as add from "./add.js";
import * as get from "./get.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf pages domains <command>

Commands:
  list        List custom domains for a Pages project
  add         Add a custom domain to a Pages project
  get         Get custom domain details
  delete      Remove a custom domain from a Pages project

Run 'cf pages domains <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "add":
    case "create":
      return add.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
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
      throw new UsageError(`Unknown pages domains command: "${subcommand}"\n\n${USAGE}`);
  }
}
