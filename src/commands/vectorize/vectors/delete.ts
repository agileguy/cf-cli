import type { Context, VectorizeMutationResult } from "../../../types/index.js";
import { parseArgs, getStringFlag, getListFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const index = getStringFlag(flags, "index");
  if (!index) throw new UsageError("--index <name> is required.");

  const ids = getListFlag(flags, "ids");
  if (!ids || ids.length === 0) throw new UsageError("--ids <id,...> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const confirmed = await confirm(
    `Delete ${ids.length} vector(s) from index "${index}"?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  const result = await ctx.client.post<VectorizeMutationResult>(
    `/accounts/${encodeURIComponent(accountId)}/vectorize/v2/indexes/${encodeURIComponent(index)}/delete_by_ids`,
    { ids },
  );

  ctx.output.success(`Deleted ${result.count} vector(s) from "${index}".`);
}
