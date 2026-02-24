import type { Context, WorkerNamespace, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const namespaces = await ctx.client.get<WorkerNamespace[]>(
    `/accounts/${accountId}/workers/dispatch/namespaces`,
  );

  const columns: ColumnDef[] = [
    { key: "namespace_id", header: "ID", width: 34 },
    { key: "namespace_name", header: "Name", width: 30 },
    {
      key: "script_count",
      header: "Scripts",
      width: 10,
      transform: (v: unknown) => String(v ?? 0),
    },
    {
      key: "created_on",
      header: "Created",
      width: 12,
      transform: (v: unknown) => String(v).slice(0, 10),
    },
  ];

  ctx.output.table(namespaces as unknown as Record<string, unknown>[], columns);
}
