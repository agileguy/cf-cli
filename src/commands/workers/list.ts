import type { Context, WorkerScript, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const scripts = await ctx.client.get<WorkerScript[]>(
    `/accounts/${accountId}/workers/scripts`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "Name", width: 30 },
    {
      key: "handlers",
      header: "Handlers",
      width: 20,
      transform: (v: unknown) => (v as string[]).join(", "),
    },
    {
      key: "compatibility_date",
      header: "Compat Date",
      width: 14,
      transform: (v: unknown) => String(v ?? "-"),
    },
    {
      key: "usage_model",
      header: "Usage Model",
      width: 14,
      transform: (v: unknown) => String(v ?? "-"),
    },
    {
      key: "modified_on",
      header: "Modified",
      width: 12,
      transform: (v: unknown) => String(v).slice(0, 10),
    },
  ];

  ctx.output.table(scripts as unknown as Record<string, unknown>[], columns);
}
