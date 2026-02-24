import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as add from "./add.js";
import * as replace from "./replace.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf rules-lists items <command>

Commands:
  list      List items in a rules list
  add       Add items to a rules list
  replace   Replace all items in a rules list
  delete    Delete items from a rules list

Run 'cf rules-lists items <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "add":
    case "create":
      return add.run(rest, ctx);
    case "replace":
      return replace.run(rest, ctx);
    case "delete":
    case "rm":
      return del.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown items command: "${subcommand}"\n\n${USAGE}`);
  }
}
