import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as rotate from "./rotate.js";

const USAGE = `Usage: cf access service-tokens <command>

Commands:
  list        List access service tokens
  create      Create a service token
  update      Update a service token
  delete      Delete a service token
  rotate      Rotate a service token secret

Run 'cf access service-tokens <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
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
    case "rotate":
      return rotate.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown access service-tokens command: "${subcommand}"\n\n${USAGE}`);
  }
}
