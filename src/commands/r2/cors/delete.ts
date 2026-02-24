import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const bucket = getStringFlag(flags, "bucket");
  if (!bucket) throw new UsageError("--bucket <name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const confirmed = await confirm(
    `Delete all CORS rules from bucket "${bucket}"?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `/accounts/${encodeURIComponent(accountId)}/r2/buckets/${encodeURIComponent(bucket)}/cors`,
  );

  ctx.output.success(`CORS rules deleted from bucket "${bucket}".`);
}
