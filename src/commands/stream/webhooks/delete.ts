import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { confirm } from "../../../utils/prompts.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  if (!await confirm("Delete stream webhook?", ctx.flags)) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete(
    `/accounts/${encodeURIComponent(accountId)}/stream/webhook`,
  );

  ctx.output.success("Stream webhook deleted.");
}
