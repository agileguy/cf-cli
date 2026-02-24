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

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <member-id> is required.");

  const roles = getListFlag(flags, "roles");
  if (!roles || roles.length === 0) throw new UsageError("--roles <role-id,...> is required.");

  const body = {
    roles: roles.map((roleId) => ({ id: roleId })),
  };

  const member = await ctx.client.put<AccountMember>(
    `/accounts/${encodeURIComponent(accountId)}/members/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Member "${id}" updated.`);
  ctx.output.detail({
    "ID": member.id,
    "Email": member.user.email,
    "Roles": member.roles.map((r) => r.name).join(", "),
  });
}
