import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as download from "./download.js";

const USAGE = `Usage: cf magic-transit pcaps <command>

Commands:
  list      List packet captures
  get       Get packet capture details
  create    Create a packet capture from JSON file
  download  Download a packet capture to file

Run 'cf magic-transit pcaps <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "create":
      return create.run(rest, ctx);
    case "download":
    case "dl":
      return download.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown pcaps command: "${subcommand}"\n\n${USAGE}`);
  }
}
