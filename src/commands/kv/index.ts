import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as namespaces from "./namespaces/index.js";
import * as list from "./list.js";
import * as get from "./get.js";
import * as put from "./put.js";
import * as del from "./delete.js";
import * as bulkWrite from "./bulk-write.js";
import * as bulkDelete from "./bulk-delete.js";

const USAGE = `Usage: cf kv <command>

Commands:
  namespaces  Manage KV namespaces (list, get, create, rename, delete)
  list        List keys in a namespace
  get         Get a key's value
  put         Write a key-value pair
  delete      Delete a key
  bulk-write  Write multiple key-value pairs from a JSON file
  bulk-delete Delete multiple keys from a JSON file

Run 'cf kv <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "namespaces":
    case "namespace":
    case "ns":
      return namespaces.run(rest, ctx);
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "put":
    case "write":
    case "set":
      return put.run(rest, ctx);
    case "delete":
    case "rm":
    case "remove":
      return del.run(rest, ctx);
    case "bulk-write":
    case "bulk_write":
      return bulkWrite.run(rest, ctx);
    case "bulk-delete":
    case "bulk_delete":
      return bulkDelete.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown kv command: "${subcommand}"\n\n${USAGE}`);
  }
}
