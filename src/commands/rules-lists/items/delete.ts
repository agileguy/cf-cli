import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag, getListFlag } from "../../../utils/args.js";
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

  const listId = getStringFlag(flags, "list");
  if (!listId) throw new UsageError("--list <list-id> is required.");

  const ids = getListFlag(flags, "ids");
  if (!ids || ids.length === 0) throw new UsageError("--ids <id,...> is required.");

  const confirmed = await confirm(
    `Delete ${ids.length} item(s) from list "${listId}"?`,
    ctx.flags,
  );
  if (!confirmed) {
    ctx.output.warn("Aborted.");
    return;
  }

  const body = { items: ids.map((id) => ({ id })) };

  await ctx.client.delete<void>(
    `/accounts/${encodeURIComponent(accountId)}/rules/lists/${encodeURIComponent(listId)}/items`,
    body,
  );

  ctx.output.success(`${ids.length} item(s) deleted from list "${listId}".`);
}
