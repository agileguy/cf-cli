import type { Context, CFImage } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const file = getStringFlag(flags, "file");
  const url = getStringFlag(flags, "url");
  const name = getStringFlag(flags, "name");

  if (!file && !url) throw new UsageError("Either --file <path> or --url <url> is required.");
  if (file && url) throw new UsageError("Provide either --file or --url, not both.");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  if (url) {
    // Upload from URL
    const formData = new FormData();
    formData.set("url", url);
    if (name) formData.set("metadata", JSON.stringify({ name }));

    const raw = await ctx.client.upload(
      `/accounts/${encodeURIComponent(accountId)}/images/v1`,
      formData,
    );

    const image = raw as CFImage;
    ctx.output.success(`Image uploaded from URL: ${image.id}`);
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
  if (name) formData.set("metadata", JSON.stringify({ name }));

  const raw = await ctx.client.upload(
    `/accounts/${encodeURIComponent(accountId)}/images/v1`,
    formData,
  );

  const image = raw as CFImage;
  ctx.output.success(`Image uploaded: ${image.id}`);
}
