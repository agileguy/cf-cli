import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";
import { confirm } from "../../utils/prompts.js";

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
    throw new UsageError(`Could not read file: ${filePath}`);
  }

  const content = await file.text();
  let keys: unknown[];
  try {
    keys = JSON.parse(content) as unknown[];
  } catch {
    throw new UsageError("File must contain valid JSON array of key names.");
  }

  if (!Array.isArray(keys)) {
    throw new UsageError("File must contain a JSON array of key names.");
  }

  const confirmed = await confirm(
    `Bulk delete ${keys.length} key(s) from namespace ${namespaceId}?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/bulk`,
    keys,
  );

  ctx.output.success(`Bulk delete of ${keys.length} key(s) from namespace ${namespaceId} completed.`);
}
