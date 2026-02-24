import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as generatePsk from "./generate-psk.js";

const USAGE = `Usage: cf magic-transit ipsec-tunnels <command>

Commands:
  list          List IPsec tunnels
  get           Get IPsec tunnel details
  create        Create an IPsec tunnel from JSON file
  update        Update an IPsec tunnel from JSON file
  delete        Delete an IPsec tunnel
  generate-psk  Generate a pre-shared key for an IPsec tunnel

Run 'cf magic-transit ipsec-tunnels <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "create":
      return create.run(rest, ctx);
    case "update":
      return update.run(rest, ctx);
    case "delete":
    case "rm":
      return del.run(rest, ctx);
    case "generate-psk":
    case "psk":
      return generatePsk.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown ipsec-tunnels command: "${subcommand}"\n\n${USAGE}`);
  }
}
