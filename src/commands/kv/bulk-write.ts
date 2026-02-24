import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const namespaceId = getStringFlag(flags, "namespaceId");
  if (!namespaceId) throw new UsageError("--namespace-id <id> is required.");

  const filePath = getStringFlag(flags, "file");
  if (!filePath) throw new UsageError("--file <json-file> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const file = Bun.file(filePath);
  const exists = await file.exists();
  if (!exists) {
    throw new UsageError(`Cannot read file: "${filePath}".`);
  }

  const content = await file.text();
  let entries: unknown[];
  try {
    entries = JSON.parse(content) as unknown[];
  } catch {
    throw new UsageError("File must contain valid JSON array of key-value entries.");
  }

  if (!Array.isArray(entries)) {
    throw new UsageError("File must contain a JSON array of key-value entries.");
  }

  await ctx.client.put<void>(
    `/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/bulk`,
    entries,
  );

  ctx.output.success(`Bulk write of ${entries.length} key(s) to namespace ${namespaceId} completed.`);
}
