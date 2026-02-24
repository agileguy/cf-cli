import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag } from "../../utils/args.js";
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

  // Value can come from --value or --file
  const value = getStringFlag(flags, "value");
  const filePath = getStringFlag(flags, "file");

  if (!value && !filePath) {
    throw new UsageError("Either --value <value> or --file <path> is required.");
  }

  let body: string;
  if (filePath) {
    const file = Bun.file(filePath);
    const exists = await file.exists();
    if (!exists) {
      throw new UsageError(`Cannot read file: "${filePath}".`);
    }
    body = await file.text();
  } else {
    body = value!;
  }

  const queryParts: string[] = [];
  const ttl = getNumberFlag(flags, "ttl");
  if (ttl) queryParts.push(`expiration_ttl=${ttl}`);
  const metadata = getStringFlag(flags, "metadata");
  if (metadata) queryParts.push(`metadata=${encodeURIComponent(metadata)}`);

  const qs = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  await ctx.client.put<void>(
    `/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}${qs}`,
    body,
  );

  ctx.output.success(`Key "${key}" written to namespace ${namespaceId}.`);
}
