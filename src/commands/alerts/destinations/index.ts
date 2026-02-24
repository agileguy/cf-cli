import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as webhooks from "./webhooks.js";
import * as pagerduty from "./pagerduty.js";

const USAGE = `Usage: cf alerts destinations <command>

Commands:
  webhooks    Manage webhook destinations
  pagerduty   Manage PagerDuty destinations

Run 'cf alerts destinations <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "webhooks":
      return webhooks.run(rest, ctx);
    case "pagerduty":
      return pagerduty.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown destinations command: "${subcommand}"\n\n${USAGE}`);
  }
}
