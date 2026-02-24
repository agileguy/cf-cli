import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as revoke from "./revoke.js";
import * as registrations from "./registrations/index.js";
import * as posture from "./posture/index.js";

const USAGE = `Usage: cf devices <command>

Commands:
  list            List devices
  get             Get device details
  revoke          Revoke a device
  registrations   Manage device registrations (list)
  posture         Manage device posture (rules)

Run 'cf devices <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "revoke":
      return revoke.run(rest, ctx);
    case "registrations":
    case "regs":
      return registrations.run(rest, ctx);
    case "posture":
      return posture.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown devices command: "${subcommand}"\n\n${USAGE}`);
  }
}
