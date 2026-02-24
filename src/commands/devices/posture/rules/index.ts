import type { Context } from "../../../../types/index.js";
import { UsageError } from "../../../../utils/errors.js";

import * as list from "./list.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf devices posture rules <command>

Commands:
  list        List device posture rules
  create      Create a device posture rule
  update      Update a device posture rule
  delete      Delete a device posture rule

Run 'cf devices posture rules <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "create":
      return create.run(rest, ctx);
    case "update":
      return update.run(rest, ctx);
    case "delete":
    case "rm":
      return del.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown devices posture rules command: "${subcommand}"\n\n${USAGE}`);
  }
}
