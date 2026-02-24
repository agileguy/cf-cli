import type { Context, VectorizeIndex } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const index = getStringFlag(flags, "index");
  if (!index) throw new UsageError("--index <name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const idx = await ctx.client.get<VectorizeIndex>(
    `/accounts/${encodeURIComponent(accountId)}/vectorize/v2/indexes/${encodeURIComponent(index)}`,
  );

  ctx.output.detail({
    "Name": idx.name,
    "Description": idx.description ?? "-",
    "Dimensions": idx.config.dimensions,
    "Metric": idx.config.metric,
    "Created": idx.created_on ?? "-",
    "Modified": idx.modified_on ?? "-",
  });
}
