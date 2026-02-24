import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as update from "./update.js";
import * as transferIn from "./transfer-in.js";

const USAGE = `Usage: cf registrar <command>

Commands:
  list          List registered domains
  get           Get domain registration details
  update        Update domain registration settings
  transfer-in   Initiate domain transfer

Run 'cf registrar <command> --help' for more information.`;

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
      return update.run(rest, ctx);
    case "transfer-in":
    case "transfer":
      return transferIn.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown registrar command: "${subcommand}"\n\n${USAGE}`);
  }
}
