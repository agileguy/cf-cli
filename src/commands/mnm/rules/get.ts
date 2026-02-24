import type { Context, MNMRule } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <rule-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const rule = await ctx.client.get<MNMRule>(
    `/accounts/${encodeURIComponent(accountId)}/mnm/rules/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": rule.id,
    "Name": rule.name,
    "Description": rule.description ?? "",
    "Prefixes": (rule.prefixes ?? []).join(", "),
    "Auto Advertisement": rule.automatic_advertisement ?? false,
    "Duration": rule.duration ?? "",
    "Bandwidth Threshold": rule.bandwidth_threshold ?? "",
    "Packet Threshold": rule.packet_threshold ?? "",
    "Created": rule.created_on ?? "",
    "Modified": rule.modified_on ?? "",
  });
}
