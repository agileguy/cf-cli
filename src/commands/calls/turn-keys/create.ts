import type { Context, CallsTurnKey } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const key = await ctx.client.post<CallsTurnKey>(
    `/accounts/${encodeURIComponent(accountId)}/calls/turn_keys`,
    { name },
  );

  ctx.output.success(`TURN key "${name}" created (ID: ${key.key_id}).`);
}
