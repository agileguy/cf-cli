import type { Context, AccountMember } from "../../../types/index.js";
import { parseArgs, getStringFlag, getListFlag } from "../../../utils/args.js";
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

  const roles = getListFlag(flags, "roles");
  if (!roles || roles.length === 0) throw new UsageError("--roles <role-id,...> is required.");

  const body = {
    email,
    roles: roles.map((id) => ({ id })),
  };

  const member = await ctx.client.post<AccountMember>(
    `/accounts/${encodeURIComponent(accountId)}/members`,
    body,
  );

  ctx.output.success(`Member added: ${email}`);
  ctx.output.detail({
    "ID": member.id,
    "Email": member.user.email,
    "Status": member.status,
    "Roles": member.roles.map((r) => r.name).join(", "),
  });
}
