import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as apps from "./apps/index.js";
import * as analytics from "./analytics/index.js";

const USAGE = `Usage: cf spectrum <command>

Commands:
  apps        Manage Spectrum applications (zone-scoped)
  analytics   View Spectrum analytics (zone-scoped)

Run 'cf spectrum <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "apps":
    case "app":
      return apps.run(rest, ctx);
    case "analytics":
      return analytics.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown spectrum command: "${subcommand}"\n\n${USAGE}`);
  }
}
