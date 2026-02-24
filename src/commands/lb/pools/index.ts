import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as preview from "./preview.js";
import * as health from "./health.js";

const USAGE = `Usage: cf lb pools <action>

Actions:
  list      List load balancer pools
  get       Get pool details
  create    Create a pool from JSON file
  update    Update a pool (full replace)
  delete    Delete a pool
  preview   Preview pool status
  health    Get pool health`;

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
      return create.run(rest, ctx);
    case "update":
      return update.run(rest, ctx);
    case "delete":
    case "rm":
      return del.run(rest, ctx);
    case "preview":
      return preview.run(rest, ctx);
    case "health":
      return health.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown lb pools action: "${action}"\n\n${USAGE}`);
  }
}
