import type { Context, AddressPrefix, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const prefixes = await ctx.client.get<AddressPrefix[]>(
    `/accounts/${encodeURIComponent(accountId)}/addressing/prefixes`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "cidr", header: "CIDR", width: 20 },
    { key: "asn", header: "ASN", width: 10 },
    { key: "description", header: "Description", width: 24 },
    { key: "advertised", header: "Advertised", width: 12, transform: (v: unknown) => (v as boolean) ? "Yes" : "No" },
    { key: "approved", header: "Approved", width: 12 },
  ];

  ctx.output.table(prefixes as unknown as Record<string, unknown>[], columns);
}
