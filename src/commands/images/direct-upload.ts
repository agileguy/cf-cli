import type { Context, CFImageDirectUpload } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);
  const expiry = getStringFlag(flags, "expiry");

  const formData = new FormData();
  if (expiry) formData.set("expiry", expiry);

  const result = await ctx.client.upload(
    `/accounts/${encodeURIComponent(accountId)}/images/v2/direct_upload`,
    formData,
  ) as CFImageDirectUpload;

  ctx.output.detail({
    "ID": result.id,
    "Upload URL": result.uploadURL,
  });
}
