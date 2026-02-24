import type { Context, IntelAttackSurface } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const params: Record<string, string> = {};
  const type = getStringFlag(flags, "type");
  if (type) params["type"] = type;

  const result = await ctx.client.get<IntelAttackSurface>(
    `/accounts/${encodeURIComponent(accountId)}/intel/attack-surface-report`,
    params,
  );

  ctx.output.json(result);
}
