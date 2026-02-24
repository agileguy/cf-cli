import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as settings from "./settings/index.js";
import * as scripts from "./scripts/index.js";
import * as connections from "./connections/index.js";
import * as policies from "./policies/index.js";

const USAGE = `Usage: cf page-shield <command>

Commands:
  settings       Manage Page Shield settings
  scripts        View detected scripts
  connections    View detected connections
  policies       Manage Page Shield policies

Run 'cf page-shield <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "settings":
    case "setting":
      return settings.run(rest, ctx);
    case "scripts":
    case "script":
      return scripts.run(rest, ctx);
    case "connections":
    case "connection":
      return connections.run(rest, ctx);
    case "policies":
    case "policy":
      return policies.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown page-shield command: "${subcommand}"\n\n${USAGE}`);
  }
}
