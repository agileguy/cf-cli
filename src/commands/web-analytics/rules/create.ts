import type { Context, WebAnalyticsRule } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const site = getStringFlag(flags, "site");
  if (!site) throw new UsageError("--site <site-tag> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <rule-json> is required.");

  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  let body: unknown;
  try {
    body = JSON.parse(content);
  } catch {
    throw new UsageError("File must contain valid JSON.");
  }

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const rule = await ctx.client.post<WebAnalyticsRule>(
    `/accounts/${encodeURIComponent(accountId)}/rum/v2/${encodeURIComponent(site)}/rule`,
    body,
  );

  ctx.output.success(`Web Analytics rule created (ID: ${rule.id}).`);
  ctx.output.detail({
    "ID": rule.id,
    "Host": rule.host ?? "",
    "Paths": (rule.paths ?? []).join(", "),
    "Inclusive": rule.inclusive ?? false,
  });
}
