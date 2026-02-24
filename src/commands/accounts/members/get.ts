import type { Context, AccountMember } from "../../../types/index.js";
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

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <member-id> is required.");

  const member = await ctx.client.get<AccountMember>(
    `/accounts/${encodeURIComponent(accountId)}/members/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": member.id,
    "Email": member.user.email,
    "Name": [member.user.first_name, member.user.last_name].filter(Boolean).join(" ") || "",
    "Status": member.status,
    "Roles": member.roles.map((r) => r.name).join(", "),
    "2FA Enabled": member.user.two_factor_authentication_enabled ?? false,
  });
}
