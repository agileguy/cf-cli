import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as buckets from "./buckets/index.js";
import * as cors from "./cors/index.js";
import * as lifecycle from "./lifecycle/index.js";
import * as customDomains from "./custom-domains/index.js";
import * as eventNotifications from "./event-notifications/index.js";
import * as metrics from "./metrics/index.js";

const USAGE = `Usage: cf r2 <command>

Commands:
  buckets              Manage R2 buckets (list, get, create, update, delete)
  cors                 Manage bucket CORS configuration
  lifecycle            Manage bucket lifecycle rules
  custom-domains       Manage bucket custom domains
  event-notifications  Manage bucket event notifications
  metrics              View bucket metrics

Run 'cf r2 <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "buckets":
    case "bucket":
      return buckets.run(rest, ctx);
    case "cors":
      return cors.run(rest, ctx);
    case "lifecycle":
      return lifecycle.run(rest, ctx);
    case "custom-domains":
    case "custom-domain":
    case "domains":
      return customDomains.run(rest, ctx);
    case "event-notifications":
    case "event-notification":
    case "notifications":
      return eventNotifications.run(rest, ctx);
    case "metrics":
    case "stats":
      return metrics.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown r2 command: "${subcommand}"\n\n${USAGE}`);
  }
}
