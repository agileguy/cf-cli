import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as query from "./query.js";
import * as exportCmd from "./export.js";
import * as importCmd from "./import.js";

const USAGE = `Usage: cf d1 <command>

Commands:
  list        List D1 databases
  get         Get D1 database details
  create      Create a D1 database
  update      Update a D1 database
  delete      Delete a D1 database
  query       Execute a SQL query against a D1 database
  export      Export a D1 database
  import      Import SQL into a D1 database

Run 'cf d1 <command> --help' for more information.`;

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
    case "update":
      return update.run(rest, ctx);
    case "delete":
    case "rm":
    case "remove":
      return del.run(rest, ctx);
    case "query":
    case "sql":
      return query.run(rest, ctx);
    case "export":
      return exportCmd.run(rest, ctx);
    case "import":
      return importCmd.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown d1 command: "${subcommand}"\n\n${USAGE}`);
  }
}
