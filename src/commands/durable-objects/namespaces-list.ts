import type { Context, DurableObjectNamespace, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const namespaces = await ctx.client.get<DurableObjectNamespace[]>(
    `/accounts/${accountId}/workers/durable_objects/namespaces`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    {
      key: "script",
      header: "Script",
      width: 20,
      transform: (v: unknown) => String(v ?? "-"),
    },
    {
      key: "class",
      header: "Class",
      width: 20,
      transform: (v: unknown) => String(v ?? "-"),
    },
  ];

  ctx.output.table(namespaces as unknown as Record<string, unknown>[], columns);
}
