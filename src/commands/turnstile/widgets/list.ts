import type { Context, TurnstileWidget, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const widgets = await ctx.client.get<TurnstileWidget[]>(
    `/accounts/${encodeURIComponent(accountId)}/challenges/widgets`,
  );

  const columns: ColumnDef[] = [
    { key: "sitekey", header: "Sitekey", width: 36 },
    { key: "name", header: "Name", width: 25 },
    { key: "mode", header: "Mode", width: 12 },
    { key: "domains", header: "Domains", transform: (v: unknown) => Array.isArray(v) ? v.join(", ") : String(v ?? "") },
    { key: "created_on", header: "Created" },
  ];

  ctx.output.table(widgets as unknown as Record<string, unknown>[], columns);
}
