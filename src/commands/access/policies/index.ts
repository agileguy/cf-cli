import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf access policies <command>

Commands:
  list        List access policies for an application
  get         Get an access policy
  create      Create an access policy
  update      Update an access policy
  delete      Delete an access policy

Run 'cf access policies <command> --help' for more information.`;

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
    case "set":
      return update.run(rest, ctx);
    case "delete":
    case "rm":
    case "remove":
      return del.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown access policies command: "${subcommand}"\n\n${USAGE}`);
  }
}
