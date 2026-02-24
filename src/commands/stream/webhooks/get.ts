import type { Context, StreamWebhook } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  const webhook = await ctx.client.get<StreamWebhook>(
    `/accounts/${encodeURIComponent(accountId)}/stream/webhook`,
  );

  ctx.output.detail({
    "Notification URL": webhook.notificationUrl ?? "Not configured",
    "Modified": webhook.modified ?? "-",
  });
}
