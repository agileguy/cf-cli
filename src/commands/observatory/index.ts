import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as pages from "./pages/index.js";
import * as tests from "./tests/index.js";
import * as schedule from "./schedule/index.js";

const USAGE = `Usage: cf observatory <command>

Commands:
  pages       List tested pages
  tests       Manage speed tests
  schedule    Manage test schedules

Run 'cf observatory <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "pages":
    case "page":
      return pages.run(rest, ctx);
    case "tests":
    case "test":
      return tests.run(rest, ctx);
    case "schedule":
    case "schedules":
      return schedule.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown observatory command: "${subcommand}"\n\n${USAGE}`);
  }
}
