import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as addressMaps from "./address-maps/index.js";
import * as prefixes from "./prefixes/index.js";
import * as regionalHostnames from "./regional-hostnames/index.js";

const USAGE = `Usage: cf addressing <command>

Commands:
  address-maps          Manage address maps
  prefixes              Manage IP prefixes (BGP, delegations)
  regional-hostnames    Manage regional hostnames (zone-scoped)

Run 'cf addressing <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "address-maps":
    case "address-map":
      return addressMaps.run(rest, ctx);
    case "prefixes":
    case "prefix":
      return prefixes.run(rest, ctx);
    case "regional-hostnames":
    case "regional-hostname":
      return regionalHostnames.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown addressing command: "${subcommand}"\n\n${USAGE}`);
  }
}
