import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as dns from "./dns/index.js";
import * as http from "./http/index.js";
import * as network from "./network/index.js";
import * as dlp from "./dlp/index.js";

const USAGE = `Usage: cf gateway <command>

Commands:
  dns         Manage Gateway DNS policies
  http        Manage Gateway HTTP policies
  network     Manage Gateway network policies
  dlp         Manage Gateway DLP profiles

Run 'cf gateway <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "dns":
      return dns.run(rest, ctx);
    case "http":
      return http.run(rest, ctx);
    case "network":
      return network.run(rest, ctx);
    case "dlp":
      return dlp.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown gateway command: "${subcommand}"\n\n${USAGE}`);
  }
}
