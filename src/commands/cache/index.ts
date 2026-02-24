import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as purge from "./purge.js";

const USAGE = `Usage: cf cache <command>

Commands:
  purge     Purge cached content

Run 'cf cache <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "purge":
    case "clear":
      return purge.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown cache command: "${subcommand}"\n\n${USAGE}`);
  }
}
