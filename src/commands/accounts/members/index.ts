import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as add from "./add.js";
import * as update from "./update.js";
import * as remove from "./remove.js";

const USAGE = `Usage: cf accounts members <command>

Commands:
  list      List account members
  get       Get a member's details
  add       Add a member to the account
  update    Update a member's roles
  remove    Remove a member from the account

Run 'cf accounts members <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "add":
    case "create":
      return add.run(rest, ctx);
    case "update":
      return update.run(rest, ctx);
    case "remove":
    case "rm":
    case "delete":
      return remove.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown members command: "${subcommand}"\n\n${USAGE}`);
  }
}
