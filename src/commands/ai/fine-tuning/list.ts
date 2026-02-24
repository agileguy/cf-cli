import type { Context, AIFineTune, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const jobs = await ctx.client.get<AIFineTune[]>(
    `/accounts/${encodeURIComponent(accountId)}/ai/finetunes`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "model", header: "Model", width: 40 },
    { key: "status", header: "Status", width: 15 },
    { key: "created_at", header: "Created", width: 24 },
  ];

  ctx.output.table(jobs as unknown as Record<string, unknown>[], columns);
}
