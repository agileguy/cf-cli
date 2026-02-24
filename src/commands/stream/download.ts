import type { Context, StreamDownloadUrl } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <video-id> is required.");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const result = await ctx.client.get<StreamDownloadUrl>(
    `/accounts/${encodeURIComponent(accountId)}/stream/${encodeURIComponent(id)}/downloads`,
  );

  ctx.output.detail({
    "Video ID": id,
    "Download URL": result.default?.url ?? "-",
    "Status": result.default?.status ?? "-",
    "Progress": result.default?.percentComplete != null ? `${result.default.percentComplete}%` : "-",
  });
}
