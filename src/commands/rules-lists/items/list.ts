import type { Context, RulesListItem, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const listId = getStringFlag(flags, "list");
  if (!listId) throw new UsageError("--list <list-id> is required.");

  const params: Record<string, string> = {};
  const cursor = getStringFlag(flags, "cursor");
  if (cursor) params["cursor"] = cursor;

  const items = await ctx.client.get<RulesListItem[]>(
    `/accounts/${encodeURIComponent(accountId)}/rules/lists/${encodeURIComponent(listId)}/items`,
    params,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "ip", header: "IP", width: 20 },
    { key: "asn", header: "ASN", width: 12 },
    { key: "comment", header: "Comment", width: 30 },
    { key: "created_on", header: "Created", width: 12, transform: (v: unknown) => String(v).slice(0, 10) },
  ];

  ctx.output.table(items, columns);
}
