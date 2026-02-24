import type { Context, Pipeline } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <pipeline-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const pipeline = await ctx.client.get<Pipeline>(
    `/accounts/${encodeURIComponent(accountId)}/pipelines/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": pipeline.id,
    "Name": pipeline.name,
    "Endpoint": pipeline.endpoint,
    "Created": pipeline.created_on ?? "(unknown)",
    "Modified": pipeline.modified_on ?? "(unknown)",
  });
}
