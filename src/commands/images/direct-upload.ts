import type { Context, CFImageDirectUpload } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);
  const expiry = getStringFlag(flags, "expiry");

  const body: Record<string, unknown> = {};
  if (expiry) body["expiry"] = expiry;

  const result = await ctx.client.post<CFImageDirectUpload>(
    `/accounts/${encodeURIComponent(accountId)}/images/v2/direct_upload`,
    body,
  );

  ctx.output.detail({
    "ID": result.id,
    "Upload URL": result.uploadURL,
  });
}
