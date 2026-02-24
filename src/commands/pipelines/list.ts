import type { Context, Pipeline, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const pipelines = await ctx.client.get<Pipeline[]>(
    `/accounts/${encodeURIComponent(accountId)}/pipelines`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "endpoint", header: "Endpoint", width: 40 },
    { key: "created_on", header: "Created" },
  ];

  ctx.output.table(pipelines as unknown as Record<string, unknown>[], columns);
}
