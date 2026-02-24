import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as get from "./get.js";
import * as set from "./set.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf stream webhooks <command>

Commands:
  get       Get the current webhook configuration
  set       Set the webhook notification URL
  delete    Delete the webhook

Run 'cf stream webhooks <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "set":
    case "update":
      return set.run(rest, ctx);
    case "delete":
    case "rm":
    case "remove":
      return del.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown stream webhooks command: "${subcommand}"\n\n${USAGE}`);
  }
}
