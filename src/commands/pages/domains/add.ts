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

  const result = await ctx.client.post<PagesDomain>(
    `/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(project)}/domains`,
    { name: domain },
  );

  ctx.output.success(`Domain "${result.name}" added to project "${project}" (status: ${result.status}).`);
}
