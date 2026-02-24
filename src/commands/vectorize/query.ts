import type { Context, VectorizeQueryResult, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag, getBoolFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const index = getStringFlag(flags, "index");
  if (!index) throw new UsageError("--index <name> is required.");

  const vectorStr = getStringFlag(flags, "vector");
  if (!vectorStr) throw new UsageError("--vector <json-array> is required.");

  let vector: number[];
  try {
    vector = JSON.parse(vectorStr) as number[];
    if (!Array.isArray(vector)) throw new Error("Not an array");
  } catch {
    throw new UsageError(`Invalid vector JSON: "${vectorStr}". Must be a JSON array of numbers.`);
  }

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = { vector };

  const topK = getNumberFlag(flags, "topK");
  if (topK !== undefined) body["topK"] = topK;

  const filterStr = getStringFlag(flags, "filter");
  if (filterStr) {
    try {
      body["filter"] = JSON.parse(filterStr);
    } catch {
      throw new UsageError(`Invalid filter JSON: "${filterStr}".`);
    }
  }

  const returnMetadata = getBoolFlag(flags, "returnMetadata");
  if (returnMetadata) body["returnMetadata"] = true;

  const returnValues = getBoolFlag(flags, "returnValues");
  if (returnValues) body["returnValues"] = true;

  const result = await ctx.client.post<VectorizeQueryResult>(
    `/accounts/${encodeURIComponent(accountId)}/vectorize/v2/indexes/${encodeURIComponent(index)}/query`,
    body,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 30 },
    { key: "score", header: "Score", width: 12 },
    {
      key: "metadata",
      header: "Metadata",
      width: 40,
      transform: (v: unknown) => v ? JSON.stringify(v) : "-",
    },
  ];

  ctx.output.table(
    (result.matches ?? []) as unknown as Record<string, unknown>[],
    columns,
  );
}
