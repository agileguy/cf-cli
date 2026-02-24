import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as verify from "./verify.js";
import * as roll from "./roll.js";

const USAGE = `Usage: cf user tokens <command>

Commands:
  list      List API tokens
  get       Get token details
  create    Create a new API token
  update    Update an API token
  delete    Delete an API token
  verify    Verify the current API token
  roll      Roll (regenerate) a token value

Run 'cf user tokens <command> --help' for more information.`;

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
    case "edit":
      return update.run(rest, ctx);
    case "delete":
    case "rm":
    case "remove":
      return del.run(rest, ctx);
    case "verify":
    case "check":
      return verify.run(rest, ctx);
    case "roll":
    case "rotate":
      return roll.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown tokens command: "${subcommand}"\n\n${USAGE}`);
  }
}
