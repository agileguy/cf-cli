import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as lansList from "./lans-list.js";
import * as wansList from "./wans-list.js";

const USAGE = `Usage: cf magic-transit sites <command>

Commands:
  list    List Magic WAN sites
  get     Get site details
  create  Create a site from JSON file
  update  Update a site from JSON file
  delete  Delete a site
  lans    List LANs for a site
  wans    List WANs for a site

Run 'cf magic-transit sites <command> --help' for more information.`;

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
    case "lans":
      return lansList.run(rest, ctx);
    case "wans":
      return wansList.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown sites command: "${subcommand}"\n\n${USAGE}`);
  }
}
