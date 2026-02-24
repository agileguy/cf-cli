import type { Context, PagesProject } from "../../types/index.js";
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

  const p = await ctx.client.get<PagesProject>(
    `/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(project)}`,
  );

  ctx.output.detail({
    "ID": p.id,
    "Name": p.name,
    "Subdomain": p.subdomain,
    "Domains": p.domains.join(", ") || "(none)",
    "Production Branch": p.production_branch,
    "Created": p.created_on,
    "Latest Deployment": p.latest_deployment?.id ?? "(none)",
    "Latest URL": p.latest_deployment?.url ?? "(none)",
  });
}
