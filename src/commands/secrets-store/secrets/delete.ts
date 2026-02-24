import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

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

  const confirmed = await confirm(
    `Delete secret "${name}" from store "${store}"?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `/accounts/${encodeURIComponent(accountId)}/secrets_store/stores/${encodeURIComponent(store)}/secrets/${encodeURIComponent(name)}`,
  );

  ctx.output.success(`Secret "${name}" deleted from store "${store}".`);
}
