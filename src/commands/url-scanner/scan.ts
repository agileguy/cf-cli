import type { Context, URLScanResult } from "../../types/index.js";
import { parseArgs, getStringFlag, getBoolFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const url = getStringFlag(flags, "url");
  if (!url) throw new UsageError("--url <url> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const isPublic = getBoolFlag(flags, "public");
  const country = getStringFlag(flags, "country");

  const body: Record<string, unknown> = {
    url,
    visibility: isPublic ? "Public" : "Private",
  };
  if (country) body["customHeaders"] = { "CF-IPCountry": country };

  const result = await ctx.client.post<URLScanResult>(
    `/accounts/${encodeURIComponent(accountId)}/urlscanner/scan`,
    body,
  );

  ctx.output.json(result);
}
