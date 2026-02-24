import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as deployments from "./deployments/index.js";
import * as domains from "./domains/index.js";

const USAGE = `Usage: cf pages <command>

Commands:
  list          List Pages projects
  get           Get Pages project details
  create        Create a Pages project
  update        Update a Pages project
  delete        Delete a Pages project
  deployments   Manage project deployments
  domains       Manage project custom domains

Run 'cf pages <command> --help' for more information.`;

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
    case "deployments":
    case "deployment":
    case "deploys":
      return deployments.run(rest, ctx);
    case "domains":
    case "domain":
      return domains.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown pages command: "${subcommand}"\n\n${USAGE}`);
  }
}
