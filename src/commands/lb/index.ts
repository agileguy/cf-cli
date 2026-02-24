import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as patch from "./patch.js";
import * as del from "./delete.js";
import * as pools from "./pools/index.js";
import * as monitors from "./monitors/index.js";
import * as regions from "./regions.js";

const USAGE = `Usage: cf lb <command>

Commands:
  list        List load balancers
  get         Get load balancer details
  create      Create a load balancer from JSON file
  update      Update a load balancer (full replace)
  patch       Patch a load balancer (partial update)
  delete      Delete a load balancer
  pools       Manage load balancer pools (list, get, create, update, delete, preview, health)
  monitors    Manage load balancer monitors (list, get, create, update, delete, preview, references)
  regions     List available load balancer regions

Run 'cf lb <command> --help' for more information.`;

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
    case "patch":
      return patch.run(rest, ctx);
    case "delete":
    case "rm":
      return del.run(rest, ctx);
    case "pools":
    case "pool":
      return pools.run(rest, ctx);
    case "monitors":
    case "monitor":
      return monitors.run(rest, ctx);
    case "regions":
      return regions.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown lb command: "${subcommand}"\n\n${USAGE}`);
  }
}
