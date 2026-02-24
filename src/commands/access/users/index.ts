import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as sessions from "./sessions.js";
import * as activeSessions from "./active-sessions.js";

const USAGE = `Usage: cf access users <command>

Commands:
  list              List access users
  sessions          List user failed login sessions
  active-sessions   List user active sessions

Run 'cf access users <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "sessions":
      return sessions.run(rest, ctx);
    case "active-sessions":
      return activeSessions.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown access users command: "${subcommand}"\n\n${USAGE}`);
  }
}
