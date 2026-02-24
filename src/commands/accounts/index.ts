import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as subscriptions from "./subscriptions/index.js";
import * as members from "./members/index.js";
import * as roles from "./roles/index.js";

const USAGE = `Usage: cf accounts <command>

Commands:
  list            List all accounts
  get             Get account details
  subscriptions   Manage account subscriptions
  members         Manage account members
  roles           Manage account roles

Run 'cf accounts <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "subscriptions":
    case "subs":
      return subscriptions.run(rest, ctx);
    case "members":
      return members.run(rest, ctx);
    case "roles":
      return roles.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown accounts command: "${subcommand}"\n\n${USAGE}`);
  }
}
