import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as rules from "./rules/index.js";

const USAGE = `Usage: cf devices posture <command>

Commands:
  rules       Manage device posture rules (list, create, update, delete)

Run 'cf devices posture <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "rules":
    case "rule":
      return rules.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown devices posture command: "${subcommand}"\n\n${USAGE}`);
  }
}
