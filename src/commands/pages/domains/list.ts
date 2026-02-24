import type { Context, PagesDomain, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const project = getStringFlag(flags, "project");
  if (!project) throw new UsageError("--project <name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const domains = await ctx.client.get<PagesDomain[]>(
    `/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(project)}/domains`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Domain", width: 40 },
    { key: "status", header: "Status", width: 15 },
    { key: "created_on", header: "Created", width: 25 },
  ];

  ctx.output.table(domains as unknown as Record<string, unknown>[], columns);
}
