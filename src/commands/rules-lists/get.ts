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

  const rulesList = await ctx.client.get<RulesList>(
    `/accounts/${encodeURIComponent(accountId)}/rules/lists/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": rulesList.id,
    "Name": rulesList.name,
    "Kind": rulesList.kind,
    "Description": rulesList.description ?? "",
    "Num Items": rulesList.num_items ?? 0,
    "Num Referencing Filters": rulesList.num_referencing_filters ?? 0,
    "Created": rulesList.created_on ?? "",
    "Modified": rulesList.modified_on ?? "",
  });
}
