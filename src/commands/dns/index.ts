import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as patch from "./patch.js";
import * as del from "./delete.js";
import * as importCmd from "./import.js";
import * as exportCmd from "./export.js";

const USAGE = `Usage: cf dns <command>

Commands:
  list      List DNS records for a zone
  get       Get a specific DNS record
  create    Create a new DNS record
  update    Full update of a DNS record (PUT)
  patch     Partial update of a DNS record (PATCH)
  delete    Delete a DNS record
  import    Import DNS records from BIND file
  export    Export DNS records as BIND format

Run 'cf dns <command> --help' for more information.`;

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
    case "patch":
      return patch.run(rest, ctx);
    case "delete":
    case "rm":
    case "remove":
      return del.run(rest, ctx);
    case "import":
      return importCmd.run(rest, ctx);
    case "export":
      return exportCmd.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown dns command: "${subcommand}"\n\n${USAGE}`);
  }
}
