import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as settings from "./settings/index.js";
import * as splitTunnels from "./split-tunnels/index.js";
import * as fleetStatus from "./fleet-status.js";

const USAGE = `Usage: cf warp <command>

Commands:
  settings       Manage WARP device settings (get, update)
  split-tunnels  Manage WARP split tunnel rules (list, add, remove)
  fleet-status   Show WARP fleet status

Run 'cf warp <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "settings":
      return settings.run(rest, ctx);
    case "split-tunnels":
    case "split":
      return splitTunnels.run(rest, ctx);
    case "fleet-status":
    case "fleet":
      return fleetStatus.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown warp command: "${subcommand}"\n\n${USAGE}`);
  }
}
