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

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <list-id> is required.");

  const body: Record<string, string> = {};
  const description = getStringFlag(flags, "description");
  if (description) body.description = description;

  const rulesList = await ctx.client.put<RulesList>(
    `/accounts/${encodeURIComponent(accountId)}/rules/lists/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Rules list "${id}" updated.`);
  ctx.output.detail({
    "ID": rulesList.id,
    "Name": rulesList.name,
    "Kind": rulesList.kind,
    "Description": rulesList.description ?? "",
  });
}
