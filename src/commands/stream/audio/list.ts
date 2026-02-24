import type { Context, StreamAudioTrack, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const video = getStringFlag(flags, "video");
  if (!video) throw new UsageError("--video <video-id> is required.");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const tracks = await ctx.client.get<StreamAudioTrack[]>(
    `/accounts/${encodeURIComponent(accountId)}/stream/${encodeURIComponent(video)}/audio`,
  );

  const columns: ColumnDef[] = [
    { key: "uid", header: "ID", width: 34 },
    { key: "label", header: "Label", width: 20 },
    { key: "language", header: "Language", width: 10 },
    { key: "default", header: "Default", width: 8, transform: (v: unknown) => v ? "Yes" : "No" },
    { key: "status", header: "Status", width: 10 },
  ];

  ctx.output.table(tracks, columns);
}
