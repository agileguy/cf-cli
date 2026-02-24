import type { Context, SecretsStore } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <store-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const store = await ctx.client.get<SecretsStore>(
    `/accounts/${encodeURIComponent(accountId)}/secrets_store/stores/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": store.id,
    "Name": store.name,
    "Status": store.status ?? "(unknown)",
    "Created": store.created_on ?? "(unknown)",
    "Modified": store.modified_on ?? "(unknown)",
  });
}
