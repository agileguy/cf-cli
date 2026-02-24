import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as add from "./add.js";
import * as remove from "./remove.js";

const USAGE = `Usage: cf r2 custom-domains <command>

Commands:
  list        List custom domains for an R2 bucket
  add         Add a custom domain to an R2 bucket
  remove      Remove a custom domain from an R2 bucket

Run 'cf r2 custom-domains <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "add":
    case "create":
      return add.run(rest, ctx);
    case "remove":
    case "delete":
    case "rm":
      return remove.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown r2 custom-domains command: "${subcommand}"\n\n${USAGE}`);
  }
}
