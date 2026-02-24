import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const namespaceId = getStringFlag(flags, "namespaceId");
  if (!namespaceId) throw new UsageError("--namespace-id <id> is required.");

  const key = getStringFlag(flags, "key");
  if (!key) throw new UsageError("--key <key-name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const value = await ctx.client.get<string>(
    `/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`,
  );

  ctx.output.raw(value);
}
