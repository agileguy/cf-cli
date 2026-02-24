import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const site = getStringFlag(flags, "site");
  if (!site) throw new UsageError("--site <site-tag> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <rule-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const confirmed = await confirm(
    `Delete Web Analytics rule "${id}" from site "${site}"?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `/accounts/${encodeURIComponent(accountId)}/rum/v2/${encodeURIComponent(site)}/rule/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`Web Analytics rule "${id}" deleted.`);
}
