import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as create from "./create.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf firewall zone-lockdowns <command>

Commands:
  list        List zone lockdown rules
  create      Create a zone lockdown rule
  delete      Delete a zone lockdown rule

Run 'cf firewall zone-lockdowns <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "create":
    case "add":
      return create.run(rest, ctx);
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
      throw new UsageError(`Unknown firewall zone-lockdowns command: "${subcommand}"\n\n${USAGE}`);
  }
}
