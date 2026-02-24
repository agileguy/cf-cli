import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as widgets from "./widgets/index.js";

const USAGE = `Usage: cf turnstile <command>

Commands:
  widgets     Manage Turnstile widgets (list, get, create, update, delete, rotate-secret)

Run 'cf turnstile <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "widgets":
    case "widget":
      return widgets.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown turnstile command: "${subcommand}"\n\n${USAGE}`);
  }
}
