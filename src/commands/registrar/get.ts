import type { Context, RegistrarDomain } from "../../types/index.js";
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

  const domain = getStringFlag(flags, "domain");
  if (!domain) throw new UsageError("--domain <domain-name> is required.");

  const reg = await ctx.client.get<RegistrarDomain>(
    `/accounts/${encodeURIComponent(accountId)}/registrar/domains/${encodeURIComponent(domain)}`,
  );

  ctx.output.detail({
    "ID": reg.id,
    "Name": reg.name,
    "Status": reg.status,
    "Auto-Renew": reg.auto_renew ?? false,
    "Locked": reg.locked ?? false,
    "Privacy": reg.privacy ?? false,
    "Name Servers": (reg.name_servers ?? []).join(", "),
    "Current Registrar": reg.current_registrar ?? "",
    "Expires": reg.expires_at ?? "",
    "Created": reg.created_at ?? "",
    "Updated": reg.updated_at ?? "",
  });
}
