import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as put from "./put.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf secrets-store secrets <command>

Commands:
  list        List secrets in a store
  get         Get a secret value
  put         Create or update a secret
  delete      Delete a secret

Run 'cf secrets-store secrets <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "put":
    case "set":
    case "write":
      return put.run(rest, ctx);
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
      throw new UsageError(`Unknown secrets-store secrets command: "${subcommand}"\n\n${USAGE}`);
  }
}
