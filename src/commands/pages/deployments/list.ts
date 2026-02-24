import type { Context, PagesDeployment, ColumnDef } from "../../../types/index.js";
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

  const params: Record<string, string> = {};
  const env = getStringFlag(flags, "env");
  if (env) params["env"] = env;

  const deployments = await ctx.client.get<PagesDeployment[]>(
    `/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(project)}/deployments`,
    params,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "environment", header: "Env", width: 12 },
    { key: "url", header: "URL", width: 50 },
    { key: "latest_stage.status", header: "Status", width: 12 },
    { key: "created_on", header: "Created", width: 25 },
  ];

  ctx.output.table(deployments as unknown as Record<string, unknown>[], columns);
}
