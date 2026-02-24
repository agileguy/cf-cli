import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as del from "./delete.js";
import * as retry from "./retry.js";
import * as rollback from "./rollback.js";

const USAGE = `Usage: cf pages deployments <command>

Commands:
  list        List deployments for a Pages project
  get         Get deployment details
  delete      Delete a deployment
  retry       Retry a deployment
  rollback    Rollback to a deployment

Run 'cf pages deployments <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "delete":
    case "rm":
    case "remove":
      return del.run(rest, ctx);
    case "retry":
      return retry.run(rest, ctx);
    case "rollback":
      return rollback.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown pages deployments command: "${subcommand}"\n\n${USAGE}`);
  }
}
