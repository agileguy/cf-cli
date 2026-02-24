import type { Context, RegistrarDomain, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const domains = await ctx.client.get<RegistrarDomain[]>(
    `/accounts/${encodeURIComponent(accountId)}/registrar/domains`,
  );

  const columns: ColumnDef[] = [
    { key: "name", header: "Domain", width: 30 },
    { key: "status", header: "Status", width: 15 },
    { key: "auto_renew", header: "Auto-Renew", width: 12 },
    { key: "locked", header: "Locked", width: 10 },
    { key: "expires_at", header: "Expires", width: 12, transform: (v: unknown) => String(v ?? "").slice(0, 10) },
  ];

  ctx.output.table(domains, columns);
}
