import type { Context, StreamCaption, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const video = getStringFlag(flags, "video");
  if (!video) throw new UsageError("--video <video-id> is required.");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const captions = await ctx.client.get<StreamCaption[]>(
    `/accounts/${encodeURIComponent(accountId)}/stream/${encodeURIComponent(video)}/captions`,
  );

  const columns: ColumnDef[] = [
    { key: "language", header: "Language", width: 12 },
    { key: "label", header: "Label", width: 30 },
    { key: "generated", header: "Auto-Generated", width: 16, transform: (v: unknown) => v ? "Yes" : "No" },
  ];

  ctx.output.table(captions, columns);
}
