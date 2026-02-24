import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as get from "./get.js";
import * as tokenVerify from "./token-verify.js";

const USAGE = `Usage: cf user <command>

Commands:
  get             Get current user details
  token verify    Verify API token validity

Run 'cf user <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "get":
    case "show":
    case "whoami":
    case "me":
      return get.run(rest, ctx);
    case "token": {
      const [tokenSubcmd, ...tokenRest] = rest;
      if (tokenSubcmd === "verify" || tokenSubcmd === "check") {
        return tokenVerify.run(tokenRest, ctx);
      }
      throw new UsageError(`Unknown user token command: "${tokenSubcmd}". Try: cf user token verify`);
    }
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown user command: "${subcommand}"\n\n${USAGE}`);
  }
}
