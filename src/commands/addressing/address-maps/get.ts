import type { Context, AddressMap } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <address-map-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const map = await ctx.client.get<AddressMap>(
    `/accounts/${encodeURIComponent(accountId)}/addressing/address_maps/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": map.id,
    "Description": map.description ?? "",
    "Default SNI": map.default_sni ?? "",
    "Enabled": map.enabled ?? false,
    "Can Delete": map.can_delete ?? false,
    "Can Modify IPs": map.can_modify_ips ?? false,
    "IPs": map.ips?.map((ip) => `${ip.type}:${ip.ip}`).join(", ") ?? "",
    "Created": map.created_at ?? "",
    "Modified": map.modified_at ?? "",
  });
}
