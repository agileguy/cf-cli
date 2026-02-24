import type { Context, UserToken, ColumnDef } from "../../../types/index.js";

export async function run(_args: string[], ctx: Context): Promise<void> {
  const tokens = await ctx.client.get<UserToken[]>("/user/tokens");

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    { key: "name", header: "Name", width: 30 },
    { key: "status", header: "Status", width: 12 },
    {
      key: "issued_on",
      header: "Issued",
      width: 12,
      transform: (v: unknown) => (typeof v === "string" ? v.slice(0, 10) : "-"),
    },
    {
      key: "expires_on",
      header: "Expires",
      width: 12,
      transform: (v: unknown) => (typeof v === "string" ? v.slice(0, 10) : "never"),
    },
  ];

  ctx.output.table(tokens, columns);
}
