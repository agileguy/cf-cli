import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <watermark-id> is required.");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  if (!await confirm(`Delete watermark ${id}?`, ctx.flags)) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete(
    `/accounts/${encodeURIComponent(accountId)}/stream/watermarks/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`Deleted watermark: ${id}`);
}
