import type { Context, StreamVideo } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <video-id> is required.");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const video = await ctx.client.get<StreamVideo>(
    `/accounts/${encodeURIComponent(accountId)}/stream/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": video.uid,
    "Status": video.status?.state ?? "unknown",
    "Duration": video.duration != null ? `${video.duration}s` : "-",
    "Size": video.size ?? "-",
    "Ready": video.readyToStream ?? false,
    "Created": video.created ?? "-",
    "Modified": video.modified ?? "-",
    "Preview": video.preview ?? "-",
    "HLS": video.playback?.hls ?? "-",
    "DASH": video.playback?.dash ?? "-",
    "Signed URLs": video.requireSignedURLs ?? false,
  });
}
