import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as rename from "./rename.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf kv namespaces <command>

Commands:
  list        List KV namespaces
  get         Get KV namespace details
  create      Create a KV namespace
  rename      Rename a KV namespace
  delete      Delete a KV namespace

Run 'cf kv namespaces <command> --help' for more information.`;

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
    case "rename":
    case "update":
      return rename.run(rest, ctx);
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
      throw new UsageError(`Unknown kv namespaces command: "${subcommand}"\n\n${USAGE}`);
  }
}
