import type { Context, RegistrarDomain } from "../../types/index.js";
import { parseArgs, getStringFlag, getBoolFlag } from "../../utils/args.js";
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

  const body: Record<string, boolean> = {};
  if (flags["autoRenew"] !== undefined) body.auto_renew = getBoolFlag(flags, "autoRenew");
  if (flags["locked"] !== undefined) body.locked = getBoolFlag(flags, "locked");
  if (flags["privacy"] !== undefined) body.privacy = getBoolFlag(flags, "privacy");

  if (Object.keys(body).length === 0) {
    throw new UsageError("At least one of --auto-renew, --locked, or --privacy is required.");
  }

  const reg = await ctx.client.put<RegistrarDomain>(
    `/accounts/${encodeURIComponent(accountId)}/registrar/domains/${encodeURIComponent(domain)}`,
    body,
  );

  ctx.output.success(`Domain "${domain}" updated.`);
  ctx.output.detail({
    "Name": reg.name,
    "Status": reg.status,
    "Auto-Renew": reg.auto_renew ?? false,
    "Locked": reg.locked ?? false,
    "Privacy": reg.privacy ?? false,
  });
}
