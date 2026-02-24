import type { Context, StreamLiveInput } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <live-input-id> is required.");

  const name = getStringFlag(flags, "name");
  const mode = getStringFlag(flags, "mode");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const body: Record<string, unknown> = {};
  if (name) body["meta"] = { name };
  if (mode) body["recording"] = { mode };

  const input = await ctx.client.put<StreamLiveInput>(
    `/accounts/${encodeURIComponent(accountId)}/stream/live_inputs/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Live input updated: ${input.uid}`);
}
