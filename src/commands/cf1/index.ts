import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as requests from "./requests/index.js";
import * as threatEvents from "./threat-events.js";
import * as pirs from "./pirs.js";
import * as scans from "./scans.js";

const USAGE = `Usage: cf cf1 <command>

Commands:
  requests        Manage Cloudforce One requests
  threat-events   List threat events
  pirs            List Priority Intelligence Requirements
  scans           List scans

Run 'cf cf1 <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "requests":
    case "request":
      return requests.run(rest, ctx);
    case "threat-events":
      return threatEvents.run(rest, ctx);
    case "pirs":
      return pirs.run(rest, ctx);
    case "scans":
      return scans.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown cf1 command: "${subcommand}"\n\n${USAGE}`);
  }
}
