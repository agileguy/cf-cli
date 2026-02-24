import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as bgpList from "./bgp-list.js";
import * as delegationsList from "./delegations-list.js";

const USAGE = `Usage: cf addressing prefixes <command>

Commands:
  list              List IP prefixes
  get               Get prefix details
  create            Create a new prefix
  update            Update a prefix
  delete            Delete a prefix
  bgp-prefixes      List BGP prefixes for a prefix
  delegations       List delegations for a prefix

Run 'cf addressing prefixes <command> --help' for more information.`;

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
    case "remove":
      return del.run(rest, ctx);
    case "bgp-prefixes":
    case "bgp":
      return bgpList.run(rest, ctx);
    case "delegations":
    case "delegation":
      return delegationsList.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown prefixes command: "${subcommand}"\n\n${USAGE}`);
  }
}
