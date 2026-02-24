import type { Context, StreamWebhook } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const url = getStringFlag(flags, "url");
  if (!url) throw new UsageError("--url <webhook-url> is required.");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const webhook = await ctx.client.put<StreamWebhook>(
    `/accounts/${encodeURIComponent(accountId)}/stream/webhook`,
    { notificationUrl: url },
  );

  ctx.output.success(`Webhook set: ${webhook.notificationUrl ?? url}`);
}
