import type { Context, VectorizeMetadataIndex, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const index = getStringFlag(flags, "index");
  if (!index) throw new UsageError("--index <name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const metaIndexes = await ctx.client.get<VectorizeMetadataIndex[]>(
    `/accounts/${encodeURIComponent(accountId)}/vectorize/v2/indexes/${encodeURIComponent(index)}/metadata_index`,
  );

  const columns: ColumnDef[] = [
    { key: "property_name", header: "Property", width: 30 },
    { key: "index_type", header: "Type", width: 20 },
  ];

  ctx.output.table(metaIndexes as unknown as Record<string, unknown>[], columns);
}
