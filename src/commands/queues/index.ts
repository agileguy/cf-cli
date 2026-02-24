import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as purge from "./purge.js";
import * as consumers from "./consumers/index.js";
import * as send from "./send.js";

const USAGE = `Usage: cf queues <command>

Commands:
  list        List all queues
  get         Get queue details
  create      Create a queue
  update      Update a queue
  delete      Delete a queue
  purge       Purge all messages from a queue
  consumers   Manage queue consumers (list, add, delete)
  messages    Send messages to a queue

Run 'cf queues <command> --help' for more information.`;

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
    case "new":
      return create.run(rest, ctx);
    case "update":
      return update.run(rest, ctx);
    case "delete":
    case "rm":
    case "remove":
      return del.run(rest, ctx);
    case "purge":
      return purge.run(rest, ctx);
    case "consumers":
    case "consumer":
      return consumers.run(rest, ctx);
    case "messages":
    case "message":
    case "send": {
      // Allow both "cf queues messages send ..." and "cf queues send ..."
      if (subcommand === "send") {
        return send.run(rest, ctx);
      }
      const [action, ...actionRest] = rest;
      if (action === "send") {
        return send.run(actionRest, ctx);
      }
      throw new UsageError(`Unknown queues messages command: "${action ?? ""}"\n\nUsage: cf queues messages send --queue <id> --body <text>`);
    }
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown queues command: "${subcommand}"\n\n${USAGE}`);
  }
}
