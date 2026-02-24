import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as add from "./add.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf stream audio <command>

Commands:
  list      List audio tracks for a video
  add       Add an audio track
  delete    Delete an audio track

Run 'cf stream audio <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "add":
    case "create":
      return add.run(rest, ctx);
    case "delete":
    case "rm":
    case "remove":
      return del.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown stream audio command: "${subcommand}"\n\n${USAGE}`);
  }
}
