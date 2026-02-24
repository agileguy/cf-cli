import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as status from "./status.js";
import * as events from "./events/index.js";
import * as rules from "./rules/index.js";

const USAGE = `Usage: cf waiting-rooms <command>

Commands:
  list        List waiting rooms
  get         Get waiting room details
  create      Create a waiting room
  update      Update a waiting room
  delete      Delete a waiting room
  status      Get waiting room status
  events      Manage waiting room events
  rules       Manage waiting room rules

Run 'cf waiting-rooms <command> --help' for more information.`;

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
    case "update":
      return update.run(rest, ctx);
    case "delete":
    case "rm":
      return del.run(rest, ctx);
    case "status":
      return status.run(rest, ctx);
    case "events":
    case "event":
      return events.run(rest, ctx);
    case "rules":
    case "rule":
      return rules.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown waiting-rooms command: "${subcommand}"\n\n${USAGE}`);
  }
}
