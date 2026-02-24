import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as policies from "../network-policies/index.js";

const USAGE = `Usage: cf gateway network <command>

Commands:
  policies    Manage gateway network policies

Run 'cf gateway network <command> --help' for more information.`;

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
      throw new UsageError(`Unknown gateway network command: "${subcommand}"\n\n${USAGE}`);
  }
}
