import type { Context, WorkerNamespaceScript, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const namespace = getStringFlag(flags, "namespace");
  if (!namespace) throw new UsageError("--namespace <namespace-name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const scripts = await ctx.client.get<WorkerNamespaceScript[]>(
    `/accounts/${accountId}/workers/dispatch/namespaces/${encodeURIComponent(namespace)}/scripts`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "Name", width: 30 },
    {
      key: "created_on",
      header: "Created",
      width: 12,
      transform: (v: unknown) => String(v).slice(0, 10),
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
