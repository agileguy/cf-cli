import type { Context, AccountMember, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const members = await ctx.client.get<AccountMember[]>(
    `/accounts/${encodeURIComponent(accountId)}/members`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    {
      key: "user",
      header: "Email",
      width: 30,
      transform: (v: unknown) => {
        const user = v as { email?: string } | undefined;
        return user?.email ?? "";
      },
    },
    { key: "status", header: "Status", width: 12 },
    {
      key: "roles",
      header: "Roles",
      width: 40,
      transform: (v: unknown) => {
        const roles = v as { name?: string }[] | undefined;
        return Array.isArray(roles) ? roles.map((r) => r.name).join(", ") : "";
      },
    },
  ];

  ctx.output.table(members, columns);
}
