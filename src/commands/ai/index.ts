import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as run_ from "./run.js";
import * as models from "./models/index.js";
import * as fineTuning from "./fine-tuning/index.js";

const USAGE = `Usage: cf ai <command>

Commands:
  run           Run inference on a Workers AI model
  models        Browse and search AI models
  fine-tuning   Manage fine-tuning jobs

Run 'cf ai <command> --help' for more information.

Examples:
  cf ai run @cf/meta/llama-3-8b-instruct --prompt "What is DNS?"
  cf ai run @cf/openai/whisper --file audio.mp3
  cf ai run @cf/stabilityai/stable-diffusion-xl-base-1.0 --prompt "a sunset" --output-file sunset.png
  cf ai models list --task Text Generation`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "run":
      return run_.run(rest, ctx);
    case "models":
    case "model":
      return models.run(rest, ctx);
    case "fine-tuning":
    case "finetune":
    case "fine-tune":
    case "ft":
      return fineTuning.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown ai command: "${subcommand}"\n\n${USAGE}`);
  }
}
