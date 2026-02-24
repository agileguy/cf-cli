import type { Context, URLScanSearch } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const query = getStringFlag(flags, "query");
  if (!query) throw new UsageError("--query <q> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const params: Record<string, string> = { q: query };
  const dateStart = getStringFlag(flags, "dateStart");
  const dateEnd = getStringFlag(flags, "dateEnd");
  if (dateStart) params["date_start"] = dateStart;
  if (dateEnd) params["date_end"] = dateEnd;

  const result = await ctx.client.get<URLScanSearch>(
    `/accounts/${encodeURIComponent(accountId)}/urlscanner/scan`,
    params,
  );

  ctx.output.json(result);
}
