import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";
import { confirm } from "../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <image-id> is required.");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  if (!await confirm(`Delete image ${id}?`, ctx.flags)) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete(
    `/accounts/${encodeURIComponent(accountId)}/images/v1/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`Deleted image: ${id}`);
}
