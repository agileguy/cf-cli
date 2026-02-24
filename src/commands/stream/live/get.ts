import type { Context, StreamLiveInput } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <live-input-id> is required.");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const input = await ctx.client.get<StreamLiveInput>(
    `/accounts/${encodeURIComponent(accountId)}/stream/live_inputs/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": input.uid,
    "Status": input.status?.current?.state ?? "-",
    "RTMPS URL": input.rtmps?.url ?? "-",
    "RTMPS Key": input.rtmps?.streamKey ?? "-",
    "SRT URL": input.srt?.url ?? "-",
    "WebRTC URL": input.webRTC?.url ?? "-",
    "Recording Mode": input.recording?.mode ?? "-",
    "Created": input.created ?? "-",
    "Modified": input.modified ?? "-",
  });
}
