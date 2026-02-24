import type { Context, AIGatewayDataset, ColumnDef } from "../../../types/index.js";
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

  const datasets = await ctx.client.get<AIGatewayDataset[]>(
    `/accounts/${encodeURIComponent(accountId)}/ai-gateway/gateways/${encodeURIComponent(gateway)}/datasets`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "description", header: "Description", width: 40 },
    { key: "created_at", header: "Created", width: 24 },
  ];

  ctx.output.table(datasets as unknown as Record<string, unknown>[], columns);
}
