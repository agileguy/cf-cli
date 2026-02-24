import type { Context, KVNamespace } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <namespace-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const ns = await ctx.client.get<KVNamespace>(
    `/accounts/${accountId}/storage/kv/namespaces/${id}`,
  );

  ctx.output.detail({
    "ID": ns.id,
    "Title": ns.title,
    "Supports URL Encoding": ns.supports_url_encoding ?? "-",
  });
}
