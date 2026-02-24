import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as settings from "./settings/index.js";
import * as schemas from "./schemas/index.js";

const USAGE = `Usage: cf api-gateway <command>

Commands:
  settings    Manage API Gateway settings
  schemas     Manage API Gateway schemas

Run 'cf api-gateway <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "settings":
    case "setting":
      return settings.run(rest, ctx);
    case "schemas":
    case "schema":
      return schemas.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown api-gateway command: "${subcommand}"\n\n${USAGE}`);
  }
}
