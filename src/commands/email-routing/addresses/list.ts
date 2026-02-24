import type { Context, EmailRoutingAddress, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const addresses = await ctx.client.get<EmailRoutingAddress[]>(
    `/accounts/${encodeURIComponent(accountId)}/email/routing/addresses`,
  );

  const columns: ColumnDef[] = [
    { key: "tag", header: "Tag", width: 36 },
    { key: "email", header: "Email", width: 40 },
    { key: "verified", header: "Verified", width: 24 },
    { key: "created", header: "Created", width: 12, transform: (v: unknown) => String(v).slice(0, 10) },
  ];

  ctx.output.table(addresses, columns);
}
