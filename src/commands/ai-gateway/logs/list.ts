import type { Context, AIGatewayLog, ColumnDef } from "../../../types/index.js";
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

  const params: Record<string, string> = {};
  const from = getStringFlag(flags, "from");
  if (from) params["from"] = from;
  const to = getStringFlag(flags, "to");
  if (to) params["to"] = to;
  const model = getStringFlag(flags, "model");
  if (model) params["model"] = model;

  const logs = await ctx.client.get<AIGatewayLog[]>(
    `/accounts/${encodeURIComponent(accountId)}/ai-gateway/gateways/${encodeURIComponent(gateway)}/logs`,
    params,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 20 },
    { key: "model", header: "Model", width: 30 },
    { key: "provider", header: "Provider", width: 15 },
    { key: "status_code", header: "Status", width: 8 },
    { key: "tokens_in", header: "Tokens In", width: 10 },
    { key: "tokens_out", header: "Tokens Out", width: 10 },
    { key: "cached", header: "Cached", width: 8 },
    { key: "created_at", header: "Created", width: 24 },
  ];

  ctx.output.table(logs as unknown as Record<string, unknown>[], columns);
}
