import type { Context, AIGatewayEvaluation, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const gateway = getStringFlag(flags, "gateway");
  if (!gateway) throw new UsageError("--gateway <gateway-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const evals = await ctx.client.get<AIGatewayEvaluation[]>(
    `/accounts/${encodeURIComponent(accountId)}/ai-gateway/gateways/${encodeURIComponent(gateway)}/evaluations`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "status", header: "Status", width: 15 },
    { key: "total_count", header: "Total", width: 10 },
    { key: "processed_count", header: "Processed", width: 10 },
    { key: "created_at", header: "Created", width: 24 },
  ];

  ctx.output.table(evals as unknown as Record<string, unknown>[], columns);
}
