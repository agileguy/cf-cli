import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as deploy from "./deploy.js";
import * as del from "./delete.js";
import * as tail from "./tail.js";
import * as routes from "./routes/index.js";
import * as cron from "./cron/index.js";
import * as domains from "./domains/index.js";
import * as versions from "./versions/index.js";
import * as platforms from "./platforms/index.js";

const USAGE = `Usage: cf workers <command>

Commands:
  list        List all worker scripts
  get         Get worker script details
  deploy      Upload/deploy a worker script
  delete      Delete a worker script
  tail        Tail worker logs in real-time
  routes      Manage worker routes
  cron        Manage cron triggers
  domains     Manage worker custom domains
  versions    View worker script versions
  platforms   Workers for Platforms (dispatch namespaces)

Run 'cf workers <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "deploy":
    case "upload":
    case "put":
      return deploy.run(rest, ctx);
    case "delete":
    case "rm":
    case "remove":
      return del.run(rest, ctx);
    case "tail":
    case "logs":
      return tail.run(rest, ctx);
    case "routes":
    case "route":
      return routes.run(rest, ctx);
    case "cron":
    case "crons":
    case "triggers":
      return cron.run(rest, ctx);
    case "domains":
    case "domain":
      return domains.run(rest, ctx);
    case "versions":
    case "version":
      return versions.run(rest, ctx);
    case "platforms":
    case "platform":
      return platforms.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown workers command: "${subcommand}"\n\n${USAGE}`);
  }
}
