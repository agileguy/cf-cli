import type { Context, VectorizeIndex } from "../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <name> is required.");

  const dimensions = getNumberFlag(flags, "dimensions");
  if (dimensions === undefined) throw new UsageError("--dimensions <n> is required.");

  const metric = getStringFlag(flags, "metric");
  if (!metric) throw new UsageError("--metric <cosine|euclidean|dot-product> is required.");

  const validMetrics = ["cosine", "euclidean", "dot-product"];
  if (!validMetrics.includes(metric)) {
    throw new UsageError(`Invalid metric "${metric}". Must be one of: ${validMetrics.join(", ")}`);
  }

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const description = getStringFlag(flags, "description");

  const body: Record<string, unknown> = {
    name,
    config: { dimensions, metric },
  };
  if (description) body["description"] = description;

  const idx = await ctx.client.post<VectorizeIndex>(
    `/accounts/${encodeURIComponent(accountId)}/vectorize/v2/indexes`,
    body,
  );

  ctx.output.success(`Vectorize index "${idx.name}" created.`);
}
