import type { Context, StreamAudioTrack } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const video = getStringFlag(flags, "video");
  if (!video) throw new UsageError("--video <video-id> is required.");

  const label = getStringFlag(flags, "label");
  if (!label) throw new UsageError("--label <label> is required.");

  const language = getStringFlag(flags, "language");
  if (!language) throw new UsageError("--language <lang> is required.");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const track = await ctx.client.post<StreamAudioTrack>(
    `/accounts/${encodeURIComponent(accountId)}/stream/${encodeURIComponent(video)}/audio`,
    { label, language },
  );

  ctx.output.success(`Audio track added: ${track.uid ?? "created"}`);
}
