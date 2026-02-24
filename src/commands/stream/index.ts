import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as upload from "./upload.js";
import * as del from "./delete.js";
import * as download from "./download.js";
import * as live from "./live/index.js";
import * as captions from "./captions/index.js";
import * as audio from "./audio/index.js";
import * as signingKeys from "./signing-keys/index.js";
import * as watermarks from "./watermarks/index.js";
import * as webhooks from "./webhooks/index.js";

const USAGE = `Usage: cf stream <command>

Commands:
  list            List all videos
  get             Get video details
  upload          Upload a video (file or URL)
  delete          Delete a video
  download        Get download URL for a video

Sub-resources:
  live            Manage live inputs
  captions        Manage video captions/subtitles
  audio           Manage audio tracks
  signing-keys    Manage signing keys
  watermarks      Manage watermark profiles
  webhooks        Manage webhook notifications

Run 'cf stream <command> --help' for more information.`;

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
    case "delete":
    case "rm":
    case "remove":
      return del.run(rest, ctx);
    case "download":
    case "dl":
      return download.run(rest, ctx);
    case "live":
      return live.run(rest, ctx);
    case "captions":
    case "caption":
    case "subtitles":
      return captions.run(rest, ctx);
    case "audio":
      return audio.run(rest, ctx);
    case "signing-keys":
    case "keys":
      return signingKeys.run(rest, ctx);
    case "watermarks":
    case "watermark":
      return watermarks.run(rest, ctx);
    case "webhooks":
    case "webhook":
      return webhooks.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown stream command: "${subcommand}"\n\n${USAGE}`);
  }
}
