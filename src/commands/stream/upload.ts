import type { Context, StreamVideo } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const file = getStringFlag(flags, "file");
  const url = getStringFlag(flags, "url");
  const name = getStringFlag(flags, "name");
  const expiry = getStringFlag(flags, "expiry");

  if (!file && !url) throw new UsageError("Either --file <path> or --url <url> is required.");
  if (file && url) throw new UsageError("Provide either --file or --url, not both.");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  if (url) {
    // Upload from URL via /copy endpoint
    const body: Record<string, unknown> = { url };
    if (name) body["meta"] = { name };
    if (expiry) body["scheduledDeletion"] = expiry;

    const video = await ctx.client.post<StreamVideo>(
      `/accounts/${encodeURIComponent(accountId)}/stream/copy`,
      body,
    );

    ctx.output.success(`Video queued for download: ${video.uid}`);
    return;
  }

  // Upload from file via multipart FormData
  let fileData: Blob;
  try {
    const bunFile = Bun.file(file!);
    const arrayBuffer = await bunFile.arrayBuffer();
    fileData = new Blob([arrayBuffer]);
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  const formData = new FormData();
  formData.set("file", fileData, file!);
  if (name) formData.set("meta", JSON.stringify({ name }));
  if (expiry) formData.set("scheduledDeletion", expiry);

  const raw = await ctx.client.upload(
    `/accounts/${encodeURIComponent(accountId)}/stream`,
    formData,
  );

  const video = raw as StreamVideo;
  ctx.output.success(`Video uploaded: ${video.uid}`);
}
