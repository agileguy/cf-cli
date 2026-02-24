import type { Context, PagesDeployment } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const project = getStringFlag(flags, "project");
  if (!project) throw new UsageError("--project <name> is required.");

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <deployment-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const deployment = await ctx.client.get<PagesDeployment>(
    `/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(project)}/deployments/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": deployment.id,
    "Short ID": deployment.short_id,
    "Project": deployment.project_name,
    "Environment": deployment.environment,
    "URL": deployment.url,
    "Status": deployment.latest_stage.status,
    "Stage": deployment.latest_stage.name,
    "Branch": deployment.deployment_trigger?.metadata?.branch ?? "(unknown)",
    "Commit": deployment.deployment_trigger?.metadata?.commit_hash ?? "(unknown)",
    "Message": deployment.deployment_trigger?.metadata?.commit_message ?? "(unknown)",
    "Created": deployment.created_on,
  });
}
