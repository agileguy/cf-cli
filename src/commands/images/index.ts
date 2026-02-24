import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as upload from "./upload.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as stats from "./stats.js";
import * as directUpload from "./direct-upload.js";
import * as variants from "./variants/index.js";
import * as signingKeys from "./signing-keys/index.js";

const USAGE = `Usage: cf images <command>

Commands:
  list            List all images
  get             Get image details
  upload          Upload an image (file or URL)
  update          Update image metadata
  delete          Delete an image
  stats           View image usage statistics
  direct-upload   Get a direct upload URL

Sub-resources:
  variants        Manage image variants
  signing-keys    Manage signing keys

Run 'cf images <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "upload":
      return upload.run(rest, ctx);
    case "update":
    case "set":
      return update.run(rest, ctx);
    case "delete":
    case "rm":
    case "remove":
      return del.run(rest, ctx);
    case "stats":
    case "usage":
      return stats.run(rest, ctx);
    case "direct-upload":
      return directUpload.run(rest, ctx);
    case "variants":
    case "variant":
      return variants.run(rest, ctx);
    case "signing-keys":
    case "keys":
      return signingKeys.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown images command: "${subcommand}"\n\n${USAGE}`);
  }
}
