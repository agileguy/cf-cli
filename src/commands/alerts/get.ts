import type { Context, AlertPolicy } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <policy-id> is required.");

  const policy = await ctx.client.get<AlertPolicy>(
    `/accounts/${encodeURIComponent(accountId)}/alerting/v3/policies/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": policy.id,
    "Name": policy.name,
    "Description": policy.description ?? "",
    "Alert Type": policy.alert_type,
    "Enabled": policy.enabled ?? true,
    "Created": policy.created ?? "",
    "Modified": policy.modified ?? "",
  });
}
