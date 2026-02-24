import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as destinations from "./destinations/index.js";
import * as silences from "./silences.js";
import * as history from "./history.js";
import * as available from "./available.js";

const USAGE = `Usage: cf alerts <command>

Commands:
  list            List alert policies
  get             Get an alert policy
  create          Create an alert policy
  update          Update an alert policy
  delete          Delete an alert policy
  destinations    Manage alert destinations (webhooks, pagerduty)
  silences        Manage alert silences
  history         View alert history
  available       List available alert types

Run 'cf alerts <command> --help' for more information.`;

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
    case "add":
      return create.run(rest, ctx);
    case "update":
      return update.run(rest, ctx);
    case "delete":
    case "rm":
      return del.run(rest, ctx);
    case "destinations":
    case "dest":
      return destinations.run(rest, ctx);
    case "silences":
      return silences.run(rest, ctx);
    case "history":
      return history.run(rest, ctx);
    case "available":
      return available.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown alerts command: "${subcommand}"\n\n${USAGE}`);
  }
}
