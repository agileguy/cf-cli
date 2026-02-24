import type { Context, AddressPrefix } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <prefix-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const prefix = await ctx.client.get<AddressPrefix>(
    `/accounts/${encodeURIComponent(accountId)}/addressing/prefixes/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": prefix.id,
    "CIDR": prefix.cidr,
    "ASN": prefix.asn ?? "",
    "Description": prefix.description ?? "",
    "Account ID": prefix.account_id ?? "",
    "Approved": prefix.approved ?? "",
    "Advertised": prefix.advertised ?? false,
    "On-Demand Enabled": prefix.on_demand_enabled ?? false,
    "On-Demand Locked": prefix.on_demand_locked ?? false,
    "LOA Document ID": prefix.loa_document_id ?? "",
    "Created": prefix.created_at ?? "",
    "Modified": prefix.modified_at ?? "",
  });
}
