import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as summary from "./summary.js";
import * as bytes from "./bytes.js";

const USAGE = `Usage: cf spectrum analytics <command>

Commands:
  summary   View aggregate analytics summary
  bytes     View byte-level analytics over time

Run 'cf spectrum analytics <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "summary":
      return summary.run(rest, ctx);
    case "bytes":
      return bytes.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown spectrum analytics command: "${subcommand}"\n\n${USAGE}`);
  }
}
