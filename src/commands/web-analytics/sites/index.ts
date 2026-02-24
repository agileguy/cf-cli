import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf web-analytics sites <action>

Actions:
  list            List all Web Analytics sites
  get             Get a site by ID
  create          Create a new site
  update          Update a site
  delete          Delete a site

Flags:
  --account-id <id>   Account ID
  --id <id>           Site tag/ID (for get, update, delete)
  --host <host>       Hostname (for create, update)

Run 'cf web-analytics sites <action> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [action, ...rest] = args;

  switch (action) {
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
      throw new UsageError(`Unknown web-analytics sites action: "${action}"\n\n${USAGE}`);
  }
}
