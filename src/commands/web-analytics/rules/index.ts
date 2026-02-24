import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as create from "./create.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf web-analytics rules <action>

Actions:
  list            List rules for a site
  create          Create a rule from JSON file
  delete          Delete a rule

Flags:
  --account-id <id>   Account ID
  --site <id>         Site tag (required)
  --id <id>           Rule ID (for delete)
  --file <path>       JSON file (for create)

Run 'cf web-analytics rules <action> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [action, ...rest] = args;

  switch (action) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "create":
    case "add":
      return create.run(rest, ctx);
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
      throw new UsageError(`Unknown web-analytics rules action: "${action}"\n\n${USAGE}`);
  }
}
