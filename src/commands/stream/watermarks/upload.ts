import type { Context, StreamWatermark } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <image-file> is required.");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  let fileData: Blob;
  try {
    const bunFile = Bun.file(file);
    const arrayBuffer = await bunFile.arrayBuffer();
    fileData = new Blob([arrayBuffer]);
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  const formData = new FormData();
  formData.set("file", fileData, file);

  const raw = await ctx.client.upload(
    `/accounts/${encodeURIComponent(accountId)}/stream/watermarks`,
    formData,
  );

  const watermark = raw as StreamWatermark;
  ctx.output.success(`Watermark uploaded: ${watermark.uid}`);
}
