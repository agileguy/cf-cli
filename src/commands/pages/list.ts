import type { Context, PagesProject, ColumnDef } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const projects = await ctx.client.get<PagesProject[]>(
    `/accounts/${encodeURIComponent(accountId)}/pages/projects`,
  );

  const columns: ColumnDef[] = [
    { key: "name", header: "Name", width: 30 },
    { key: "subdomain", header: "Subdomain", width: 40 },
    { key: "production_branch", header: "Branch", width: 20 },
    { key: "created_on", header: "Created", width: 25 },
  ];

  ctx.output.table(projects as unknown as Record<string, unknown>[], columns);
}
