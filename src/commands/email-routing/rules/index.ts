import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as create from "./create.js";
import * as get from "./get.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as catchAll from "./catch-all.js";

const USAGE = `Usage: cf email-routing rules <command>

Commands:
  list          List email routing rules
  create        Create an email routing rule
  get           Get an email routing rule
  update        Update an email routing rule
  delete        Delete an email routing rule
  catch-all     Manage catch-all rule (get, update)

Run 'cf email-routing rules <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "create":
    case "add":
      return create.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "update":
      return update.run(rest, ctx);
    case "delete":
    case "rm":
      return del.run(rest, ctx);
    case "catch-all":
      return catchAll.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown rules command: "${subcommand}"\n\n${USAGE}`);
  }
}
