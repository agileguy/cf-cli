import type { Context, StreamCaption } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const video = getStringFlag(flags, "video");
  if (!video) throw new UsageError("--video <video-id> is required.");

  const language = getStringFlag(flags, "language");
  if (!language) throw new UsageError("--language <lang> is required (e.g., en, es, fr).");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <vtt-file> is required.");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  let content: ArrayBuffer;
  try {
    content = await Bun.file(file).arrayBuffer();
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  const formData = new FormData();
  formData.set("file", new Blob([content]), file.split("/").pop() ?? "captions.vtt");

  const result = await ctx.client.uploadPut<StreamCaption>(
    `/accounts/${encodeURIComponent(accountId)}/stream/${encodeURIComponent(video)}/captions/${encodeURIComponent(language)}`,
    formData,
  );

  ctx.output.success(`Captions uploaded for language: ${result.language ?? language}`);
}
