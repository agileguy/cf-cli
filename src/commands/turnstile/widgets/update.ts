import type { Context, TurnstileWidget } from "../../../types/index.js";
import { parseArgs, getStringFlag, getListFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const sitekey = getStringFlag(flags, "sitekey");
  if (!sitekey) throw new UsageError("--sitekey <key> is required.");

  const name = getStringFlag(flags, "name");
  const mode = getStringFlag(flags, "mode");
  const domain = getStringFlag(flags, "domain");
  const domains = getListFlag(flags, "domains");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = {};
  if (name) body["name"] = name;
  if (mode) body["mode"] = mode;
  if (domains) body["domains"] = domains;
  else if (domain) body["domains"] = [domain];

  const result = await ctx.client.put<TurnstileWidget>(
    `/accounts/${encodeURIComponent(accountId)}/challenges/widgets/${encodeURIComponent(sitekey)}`,
    body,
  );

  ctx.output.success(`Widget "${result.name}" updated (sitekey: ${result.sitekey}).`);
}
