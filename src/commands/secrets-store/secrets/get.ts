import type { Context, SecretsStoreSecret } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const store = getStringFlag(flags, "store");
  if (!store) throw new UsageError("--store <store-id> is required.");

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <secret-name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const secret = await ctx.client.get<SecretsStoreSecret>(
    `/accounts/${encodeURIComponent(accountId)}/secrets_store/stores/${encodeURIComponent(store)}/secrets/${encodeURIComponent(name)}`,
  );

  ctx.output.detail({
    "Name": secret.name,
    "Value": secret.value ?? "(hidden)",
    "Comment": secret.comment ?? "(none)",
    "Status": secret.status ?? "(unknown)",
    "Created": secret.created_on ?? "(unknown)",
    "Modified": secret.modified_on ?? "(unknown)",
  });
}
