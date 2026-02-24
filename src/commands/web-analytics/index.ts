import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as sites from "./sites/index.js";
import * as rules from "./rules/index.js";

const USAGE = `Usage: cf web-analytics <command>

Commands:
  sites           Manage Web Analytics sites (list, get, create, update, delete)
  rules           Manage Web Analytics rules (list, create, delete)

Run 'cf web-analytics <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "sites":
    case "site":
      return sites.run(rest, ctx);
    case "rules":
    case "rule":
      return rules.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown web-analytics command: "${subcommand}"\n\n${USAGE}`);
  }
}
