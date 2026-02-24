import type { Context, StreamLiveInput } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <name> is required.");

  const mode = getStringFlag(flags, "mode");
  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const body: Record<string, unknown> = {
    meta: { name },
  };
  if (mode) {
    body["recording"] = { mode };
  }

  const input = await ctx.client.post<StreamLiveInput>(
    `/accounts/${encodeURIComponent(accountId)}/stream/live_inputs`,
    body,
  );

  ctx.output.detail({
    "ID": input.uid,
    "RTMPS URL": input.rtmps?.url ?? "-",
    "RTMPS Key": input.rtmps?.streamKey ?? "-",
    "SRT URL": input.srt?.url ?? "-",
    "Created": input.created ?? "-",
  });
  ctx.output.success(`Live input created: ${input.uid}`);
}
