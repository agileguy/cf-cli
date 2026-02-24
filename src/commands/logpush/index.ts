import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as jobs from "./jobs/index.js";
import * as datasets from "./datasets.js";
import * as ownership from "./ownership.js";
import * as instant from "./instant.js";

const USAGE = `Usage: cf logpush <command>

Commands:
  jobs            Manage logpush jobs (list, get, create, update, delete, enable, disable)
  datasets        List available log datasets
  ownership       Verify destination ownership
  instant         Start an instant logs session

Scope:
  --zone <zone>       Zone-scoped operations (ID or domain)
  --account-id <id>   Account-scoped operations

Run 'cf logpush <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "jobs":
    case "job":
      return jobs.run(rest, ctx);
    case "datasets":
    case "dataset":
      return datasets.run(rest, ctx);
    case "ownership":
      return ownership.run(rest, ctx);
    case "instant":
      return instant.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown logpush command: "${subcommand}"\n\n${USAGE}`);
  }
}
