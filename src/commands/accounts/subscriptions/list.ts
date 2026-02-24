import type { Context, AccountSubscription, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const subscriptions = await ctx.client.get<AccountSubscription[]>(
    `/accounts/${encodeURIComponent(accountId)}/subscriptions`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    {
      key: "rate_plan",
      header: "Plan",
      width: 24,
      transform: (v: unknown) => {
        const rp = v as AccountSubscription["rate_plan"];
        return rp?.public_name ?? rp?.id ?? "-";
      },
    },
    { key: "price", header: "Price", width: 10 },
    { key: "currency", header: "Currency", width: 10 },
    { key: "frequency", header: "Frequency", width: 12 },
    { key: "state", header: "State", width: 12 },
  ];

  ctx.output.table(subscriptions, columns);
}
