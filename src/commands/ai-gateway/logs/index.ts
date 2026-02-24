import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";

const USAGE = `Usage: cf ai-gateway logs <command>

Commands:
  list    List gateway logs

Run 'cf ai-gateway logs <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown ai-gateway logs command: "${subcommand}"\n\n${USAGE}`);
  }
}
