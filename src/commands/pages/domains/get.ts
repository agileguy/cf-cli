import type { Context, PagesDomain } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const project = getStringFlag(flags, "project");
  if (!project) throw new UsageError("--project <name> is required.");

  const domain = getStringFlag(flags, "domain");
  if (!domain) throw new UsageError("--domain <domain> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const d = await ctx.client.get<PagesDomain>(
    `/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(project)}/domains/${encodeURIComponent(domain)}`,
  );

  ctx.output.detail({
    "ID": d.id,
    "Domain": d.name,
    "Status": d.status,
    "Verification": d.verification_data?.status ?? "(none)",
    "SSL": d.ssl?.status ?? "(none)",
    "Created": d.created_on,
  });
}
