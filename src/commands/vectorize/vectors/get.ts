import type { Context, VectorizeVector, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag, getListFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const index = getStringFlag(flags, "index");
  if (!index) throw new UsageError("--index <name> is required.");

  const ids = getListFlag(flags, "ids");
  if (!ids || ids.length === 0) throw new UsageError("--ids <id,...> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const vectors = await ctx.client.post<VectorizeVector[]>(
    `/accounts/${encodeURIComponent(accountId)}/vectorize/v2/indexes/${encodeURIComponent(index)}/get_by_ids`,
    { ids },
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 30 },
    {
      key: "values",
      header: "Values",
      width: 50,
      transform: (v: unknown) => {
        if (Array.isArray(v)) {
          const arr = v as number[];
          if (arr.length > 5) return `[${arr.slice(0, 5).join(", ")}, ... (${arr.length} dims)]`;
          return JSON.stringify(arr);
        }
        return "-";
      },
    },
    {
      key: "metadata",
      header: "Metadata",
      width: 30,
      transform: (v: unknown) => v ? JSON.stringify(v) : "-",
    },
  ];

  ctx.output.table(vectors as unknown as Record<string, unknown>[], columns);
}
