import type { Context, WorkerDomain } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <domain-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const domain = await ctx.client.get<WorkerDomain>(
    `/accounts/${accountId}/workers/domains/${id}`,
  );

  ctx.output.detail({
    "ID": domain.id,
    "Hostname": domain.hostname,
    "Service": domain.service,
    "Environment": domain.environment,
    "Zone ID": domain.zone_id,
    "Zone Name": domain.zone_name,
  });
}
