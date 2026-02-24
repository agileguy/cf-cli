import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as upload from "./upload.js";
import * as del from "./delete.js";

const USAGE = `Usage: cf stream captions <command>

Commands:
  list      List captions for a video
  upload    Upload captions (VTT file)
  delete    Delete captions for a language

Run 'cf stream captions <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "upload":
    case "add":
      return upload.run(rest, ctx);
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
      throw new UsageError(`Unknown stream captions command: "${subcommand}"\n\n${USAGE}`);
  }
}
