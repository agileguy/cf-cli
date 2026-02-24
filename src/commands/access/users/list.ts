import type { Context, AccessUser, ColumnDef } from "../../../types/index.js";
import { resolveAccountScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath } = await resolveAccountScope(args, ctx);

  const users = await ctx.client.get<AccessUser[]>(
    `${basePath}/users`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 38 },
    { key: "name", header: "Name", width: 24 },
    { key: "email", header: "Email", width: 30 },
    {
      key: "access_seat",
      header: "Access Seat",
      width: 12,
      transform: (v: unknown) => v ? "yes" : "no",
    },
    {
      key: "last_successful_login",
      header: "Last Login",
      width: 12,
      transform: (v: unknown) => v ? String(v).slice(0, 10) : "",
    },
  ];

  ctx.output.table(users, columns);
}
