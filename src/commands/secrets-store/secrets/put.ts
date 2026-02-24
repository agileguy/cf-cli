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

  const value = getStringFlag(flags, "value");
  if (!value) throw new UsageError("--value <secret-value> is required.");

  const comment = getStringFlag(flags, "comment");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = {
    name,
    value,
  };

  if (comment) {
    body["comment"] = comment;
  }

  await ctx.client.put<SecretsStoreSecret>(
    `/accounts/${encodeURIComponent(accountId)}/secrets_store/stores/${encodeURIComponent(store)}/secrets/${encodeURIComponent(name)}`,
    body,
  );

  ctx.output.success(`Secret "${name}" written to store "${store}".`);
}
