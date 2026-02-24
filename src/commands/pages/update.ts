import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const project = getStringFlag(flags, "project");
  if (!project) throw new UsageError("--project <name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = {};
  const productionBranch = getStringFlag(flags, "productionBranch");
  if (productionBranch) body["production_branch"] = productionBranch;

  if (Object.keys(body).length === 0) {
    throw new UsageError("Provide at least one update flag (e.g. --production-branch).");
  }

  await ctx.client.patch<void>(
    `/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(project)}`,
    body,
  );

  ctx.output.success(`Pages project "${project}" updated.`);
}
