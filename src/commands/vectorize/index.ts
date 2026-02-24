import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as insert from "./insert.js";
import * as upsert from "./upsert.js";
import * as query from "./query.js";
import * as vectors from "./vectors/index.js";
import * as metadataIndex from "./metadata-index/index.js";

const USAGE = `Usage: cf vectorize <command>

Commands:
  list              List Vectorize indexes
  get               Get index details
  create            Create an index
  update            Update an index
  delete            Delete an index
  insert            Insert vectors from an NDJSON file
  upsert            Upsert vectors from an NDJSON file
  query             Query vectors by similarity
  vectors           Manage individual vectors
  metadata-index    Manage metadata indexes

Run 'cf vectorize <command> --help' for more information.`;

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
      return create.run(rest, ctx);
    case "update":
      return update.run(rest, ctx);
    case "delete":
    case "rm":
    case "remove":
      return del.run(rest, ctx);
    case "insert":
      return insert.run(rest, ctx);
    case "upsert":
      return upsert.run(rest, ctx);
    case "query":
    case "search":
      return query.run(rest, ctx);
    case "vectors":
    case "vector":
      return vectors.run(rest, ctx);
    case "metadata-index":
    case "metadata-indexes":
    case "meta-index":
      return metadataIndex.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown vectorize command: "${subcommand}"\n\n${USAGE}`);
  }
}
