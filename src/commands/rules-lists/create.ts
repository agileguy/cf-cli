import type { Context, RulesList } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <name> is required.");

  const kind = getStringFlag(flags, "kind");
  if (!kind) throw new UsageError("--kind <ip|asn|country|hostname> is required.");

  const body: Record<string, string> = { name, kind };
  const description = getStringFlag(flags, "description");
  if (description) body.description = description;

  const rulesList = await ctx.client.post<RulesList>(
    `/accounts/${encodeURIComponent(accountId)}/rules/lists`,
    body,
  );

  ctx.output.success(`Rules list created: ${rulesList.id}`);
  ctx.output.detail({
    "ID": rulesList.id,
    "Name": rulesList.name,
    "Kind": rulesList.kind,
    "Description": rulesList.description ?? "",
  });
}
