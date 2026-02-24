import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as get from "./get.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf vectorize vectors <command>

Commands:
  get     Get vectors by IDs
  delete  Delete vectors by IDs

Run 'cf vectorize vectors <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "get":
    case "show":
      return get.run(rest, ctx);
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
      throw new UsageError(`Unknown vectorize vectors command: "${subcommand}"\n\n${USAGE}`);
  }
}
