import type { Context, CF1Request, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  // CF1 list uses POST per API spec
  const result = await ctx.client.post<CF1Request[]>(
    `/accounts/${encodeURIComponent(accountId)}/cloudforce-one/requests/list`,
    {},
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 12 },
    { key: "title", header: "Title", width: 30 },
    { key: "status", header: "Status", width: 14 },
    { key: "priority", header: "Priority", width: 10 },
    { key: "tlp", header: "TLP", width: 8 },
    { key: "created_at", header: "Created", width: 12, transform: (v: unknown) => v ? String(v).slice(0, 10) : "-" },
  ];

  ctx.output.table(result, columns);
}
