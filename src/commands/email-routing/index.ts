import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as settings from "./settings/index.js";
import * as dns from "./dns.js";
import * as addresses from "./addresses/index.js";
import * as rules from "./rules/index.js";

const USAGE = `Usage: cf email-routing <command>

Commands:
  settings    Manage email routing settings
  dns         Show required DNS records
  addresses   Manage destination addresses
  rules       Manage email routing rules

Run 'cf email-routing <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "settings":
      return settings.run(rest, ctx);
    case "dns":
      return dns.run(rest, ctx);
    case "addresses":
      return addresses.run(rest, ctx);
    case "rules":
      return rules.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown email-routing command: "${subcommand}"\n\n${USAGE}`);
  }
}
