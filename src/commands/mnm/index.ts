import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as config from "./config/index.js";
import * as rules from "./rules/index.js";

const USAGE = `Usage: cf mnm <command>

Commands:
  config  Manage MNM configuration (get, update)
  rules   Manage MNM rules (list, get, create, update, delete)

Run 'cf mnm <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "config":
    case "cfg":
      return config.run(rest, ctx);
    case "rules":
    case "rule":
      return rules.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown mnm command: "${subcommand}"\n\n${USAGE}`);
  }
}
