import type { Context, PagesProject } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <project-name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = { name };
  const productionBranch = getStringFlag(flags, "productionBranch");
  if (productionBranch) body["production_branch"] = productionBranch;

  const project = await ctx.client.post<PagesProject>(
    `/accounts/${encodeURIComponent(accountId)}/pages/projects`,
    body,
  );

  ctx.output.success(`Pages project "${project.name}" created (subdomain: ${project.subdomain}).`);
}
