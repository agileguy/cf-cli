import type { Context, AddressMap, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const maps = await ctx.client.get<AddressMap[]>(
    `/accounts/${encodeURIComponent(accountId)}/addressing/address_maps`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "description", header: "Description", width: 30 },
    { key: "enabled", header: "Enabled", width: 8, transform: (v: unknown) => (v as boolean) ? "Yes" : "No" },
    { key: "can_delete", header: "Deletable", width: 10, transform: (v: unknown) => (v as boolean) ? "Yes" : "No" },
    { key: "created_at", header: "Created", width: 24 },
  ];

  ctx.output.table(maps as unknown as Record<string, unknown>[], columns);
}
