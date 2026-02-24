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

  const deployment = await ctx.client.post<PagesDeployment>(
    `/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(project)}/deployments/${encodeURIComponent(id)}/retry`,
  );

  ctx.output.success(`Deployment "${id}" retry initiated (new ID: ${deployment.id}).`);
}
