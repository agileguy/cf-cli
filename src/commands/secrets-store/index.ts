import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as stores from "./stores/index.js";
import * as secrets from "./secrets/index.js";

const USAGE = `Usage: cf secrets-store <command>

Commands:
  stores      Manage secrets stores (list, get)
  secrets     Manage secrets within a store (list, get, put, delete)

Run 'cf secrets-store <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "stores":
    case "store":
      return stores.run(rest, ctx);
    case "secrets":
    case "secret":
      return secrets.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown secrets-store command: "${subcommand}"\n\n${USAGE}`);
  }
}
