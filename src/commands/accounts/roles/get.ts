import type { Context, AccountRole } from "../../../types/index.js";
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
  if (!id) throw new UsageError("--id <role-id> is required.");

  const role = await ctx.client.get<AccountRole>(
    `/accounts/${encodeURIComponent(accountId)}/roles/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": role.id,
    "Name": role.name,
    "Description": role.description,
    "Permissions": JSON.stringify(role.permissions),
  });
}
