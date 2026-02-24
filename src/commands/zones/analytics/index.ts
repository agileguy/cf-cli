import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as dashboard from "./dashboard.js";
import * as colo from "./colo.js";
import * as dns from "./dns.js";

const USAGE = `Usage: cf zones analytics <command>

Commands:
  dashboard   Zone analytics dashboard
  colo        Zone analytics by colo (data center)
  dns         Zone DNS analytics

Run 'cf zones analytics <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "dashboard":
      return dashboard.run(rest, ctx);
    case "colo":
    case "colos":
      return colo.run(rest, ctx);
    case "dns":
      return dns.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown analytics command: "${subcommand}"\n\n${USAGE}`);
  }
}
