import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as enable from "./enable.js";
import * as disable from "./disable.js";

const USAGE = `Usage: cf logpush jobs <action>

Actions:
  list            List all logpush jobs
  get             Get a logpush job by ID
  create          Create a logpush job from JSON file
  update          Update a logpush job from JSON file
  delete          Delete a logpush job
  enable          Enable a logpush job
  disable         Disable a logpush job

Flags:
  --zone <zone>       Zone scope (ID or domain)
  --account-id <id>   Account scope
  --id <id>           Job ID (for get, update, delete, enable, disable)
  --file <path>       JSON file (for create, update)

Run 'cf logpush jobs <action> --help' for more information.`;

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
    case "enable":
      return enable.run(rest, ctx);
    case "disable":
      return disable.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown logpush jobs action: "${action}"\n\n${USAGE}`);
  }
}
