import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <address-id> is required.");

  const confirmed = await confirm(`Delete destination address "${id}"?`, ctx.flags);
  if (!confirmed) {
    ctx.output.warn("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `/accounts/${encodeURIComponent(accountId)}/email/routing/addresses/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`Destination address "${id}" deleted.`);
}
