import type { Context, AIGateway, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const gateways = await ctx.client.get<AIGateway[]>(
    `/accounts/${encodeURIComponent(accountId)}/ai-gateway/gateways`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "rate_limiting_limit", header: "Rate Limit", width: 12 },
    { key: "created_at", header: "Created", width: 24 },
  ];

  ctx.output.table(gateways as unknown as Record<string, unknown>[], columns);
}
