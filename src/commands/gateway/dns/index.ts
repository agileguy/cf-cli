import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as policies from "../dns-policies/index.js";

const USAGE = `Usage: cf gateway dns <command>

Commands:
  policies    Manage gateway DNS policies

Run 'cf gateway dns <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "policies":
    case "policy":
      return policies.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown gateway dns command: "${subcommand}"\n\n${USAGE}`);
  }
}
