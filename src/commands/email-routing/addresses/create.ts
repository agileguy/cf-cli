import type { Context, EmailRoutingAddress } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const email = getStringFlag(flags, "email");
  if (!email) throw new UsageError("--email <address> is required.");

  const address = await ctx.client.post<EmailRoutingAddress>(
    `/accounts/${encodeURIComponent(accountId)}/email/routing/addresses`,
    { email },
  );

  ctx.output.success(`Destination address created: ${address.email}`);
  ctx.output.detail({
    "Tag": address.tag,
    "Email": address.email,
    "Verified": address.verified ?? "pending",
    "Created": address.created,
  });
}
