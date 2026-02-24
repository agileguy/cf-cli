import type { Context, VectorizeIndex, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const indexes = await ctx.client.get<VectorizeIndex[]>(
    `/accounts/${encodeURIComponent(accountId)}/vectorize/v2/indexes`,
  );

  const columns: ColumnDef[] = [
    { key: "name", header: "Name", width: 30 },
    { key: "description", header: "Description", width: 40 },
    {
      key: "config",
      header: "Dimensions",
      width: 12,
      transform: (v: unknown) => {
        if (v && typeof v === "object" && "dimensions" in (v as Record<string, unknown>)) {
          return String((v as Record<string, unknown>).dimensions);
        }
        return "-";
      },
    },
    {
      key: "config",
      header: "Metric",
      width: 14,
      transform: (v: unknown) => {
        if (v && typeof v === "object" && "metric" in (v as Record<string, unknown>)) {
          return String((v as Record<string, unknown>).metric);
        }
        return "-";
      },
    },
    { key: "created_on", header: "Created", width: 24 },
  ];

  ctx.output.table(indexes as unknown as Record<string, unknown>[], columns);
}
