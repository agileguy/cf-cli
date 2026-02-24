import type { Context, CF1Scan, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.get<CF1Scan[]>(
    `/accounts/${encodeURIComponent(accountId)}/cloudforce-one/scans`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 12 },
    { key: "target", header: "Target", width: 30 },
    { key: "scan_type", header: "Type", width: 14 },
    { key: "status", header: "Status", width: 14 },
    { key: "created_at", header: "Created", width: 12, transform: (v: unknown) => v ? String(v).slice(0, 10) : "-" },
  ];

  ctx.output.table(result, columns);
}
