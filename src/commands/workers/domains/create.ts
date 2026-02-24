import type { Context, WorkerDomain } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const hostname = getStringFlag(flags, "hostname");
  const zoneId = getStringFlag(flags, "zoneId");
  const service = getStringFlag(flags, "service");
  const environment = getStringFlag(flags, "environment");

  if (!hostname) throw new UsageError("--hostname <hostname> is required.");
  if (!zoneId) throw new UsageError("--zone-id <zone-id> is required.");
  if (!service) throw new UsageError("--service <worker-name> is required.");
  if (!environment) throw new UsageError("--environment <env-name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const domain = await ctx.client.post<WorkerDomain>(
    `/accounts/${accountId}/workers/domains`,
    {
      hostname,
      zone_id: zoneId,
      service,
      environment,
      type: "custom",
    },
  );

  ctx.output.success(`Worker domain created: ${domain.id}`);
  ctx.output.detail({
    "ID": domain.id,
    "Hostname": domain.hostname,
    "Service": domain.service,
    "Environment": domain.environment,
    "Zone ID": domain.zone_id,
    "Zone Name": domain.zone_name,
  });
}
