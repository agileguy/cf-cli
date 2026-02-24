import type { Context, IntelASN } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const asn = getStringFlag(flags, "asn");
  if (!asn) throw new UsageError("--asn <number> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.get<IntelASN>(
    `/accounts/${encodeURIComponent(accountId)}/intel/asn/${encodeURIComponent(asn)}`,
  );

  ctx.output.json(result);
}
