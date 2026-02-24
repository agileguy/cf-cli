import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as apps from "./apps/index.js";
import * as turnKeys from "./turn-keys/index.js";

const USAGE = `Usage: cf calls <command>

Commands:
  apps        Manage Calls/WebRTC applications
  turn-keys   Manage TURN keys

Run 'cf calls <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "apps":
    case "app":
      return apps.run(rest, ctx);
    case "turn-keys":
    case "turn-key":
    case "turnkeys":
      return turnKeys.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown calls command: "${subcommand}"\n\n${USAGE}`);
  }
}
