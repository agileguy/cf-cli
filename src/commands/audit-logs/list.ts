import type { Context, AuditLogEntry, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const userEmail = getStringFlag(flags, "userEmail");
  const actionType = getStringFlag(flags, "actionType");
  const resourceType = getStringFlag(flags, "resourceType");
  const from = getStringFlag(flags, "from");
  const to = getStringFlag(flags, "to");
  const direction = getStringFlag(flags, "direction");
  const perPage = getNumberFlag(flags, "perPage");

  const params: Record<string, string> = {};
  if (userEmail) params["actor.email"] = userEmail;
  if (actionType) params["action.type"] = actionType;
  if (resourceType) params["resource.type"] = resourceType;
  if (from) params["since"] = from;
  if (to) params["before"] = to;
  if (direction) params["direction"] = direction;
  if (perPage) params["per_page"] = String(perPage);

  const entries = await ctx.client.get<AuditLogEntry[]>(
    `/accounts/${encodeURIComponent(accountId)}/audit_logs`,
    params,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 34 },
    {
      key: "actor",
      header: "Actor",
      width: 28,
      transform: (v: unknown) => {
        const actor = v as AuditLogEntry["actor"];
        return actor?.email ?? actor?.ip ?? "-";
      },
    },
    {
      key: "action",
      header: "Action",
      width: 24,
      transform: (v: unknown) => {
        const action = v as AuditLogEntry["action"];
        return action?.type ?? "-";
      },
    },
    {
      key: "resource",
      header: "Resource",
      width: 24,
      transform: (v: unknown) => {
        const resource = v as AuditLogEntry["resource"];
        return resource?.type ?? "-";
      },
    },
    {
      key: "when",
      header: "When",
      width: 20,
      transform: (v: unknown) => (typeof v === "string" ? v.slice(0, 19).replace("T", " ") : "-"),
    },
  ];

  ctx.output.table(entries, columns);
}
