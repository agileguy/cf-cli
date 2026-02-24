import type { Context, AIFineTune } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <job-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const job = await ctx.client.get<AIFineTune>(
    `/accounts/${encodeURIComponent(accountId)}/ai/finetunes/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": job.id,
    "Model": job.model,
    "Name": job.name ?? "-",
    "Description": job.description ?? "-",
    "Status": job.status ?? "-",
    "Created": job.created_at ?? "-",
    "Modified": job.modified_at ?? "-",
  });
}
