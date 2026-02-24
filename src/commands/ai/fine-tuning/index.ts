import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as create from "./create.js";
import * as get from "./get.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf ai fine-tuning <command>

Commands:
  list    List fine-tuning jobs
  create  Create a fine-tuning job
  get     Get fine-tuning job details
  delete  Delete a fine-tuning job

Run 'cf ai fine-tuning <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "create":
      return create.run(rest, ctx);
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
      throw new UsageError(`Unknown ai fine-tuning command: "${subcommand}"\n\n${USAGE}`);
  }
}
