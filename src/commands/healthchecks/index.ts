import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as preview from "./preview.js";

const USAGE = `Usage: cf healthchecks <command>

Commands:
  list      List healthchecks
  get       Get healthcheck details
  create    Create a healthcheck from JSON file
  update    Update a healthcheck
  delete    Delete a healthcheck
  preview   Preview a healthcheck from JSON file

Run 'cf healthchecks <command> --help' for more information.`;

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
    case "preview":
      return preview.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown healthchecks command: "${subcommand}"\n\n${USAGE}`);
  }
}
