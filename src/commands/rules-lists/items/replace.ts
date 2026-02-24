import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const listId = getStringFlag(flags, "list");
  if (!listId) throw new UsageError("--list <list-id> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <items-json> is required.");

  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  let body: unknown;
  try {
    body = JSON.parse(content);
  } catch {
    throw new UsageError("File must contain valid JSON.");
  }

  const result = await ctx.client.put<{ operation_id?: string }>(
    `/accounts/${encodeURIComponent(accountId)}/rules/lists/${encodeURIComponent(listId)}/items`,
    body,
  );

  ctx.output.success(`Items replaced in list "${listId}".`);
  if (result.operation_id) {
    ctx.output.detail({ "Operation ID": result.operation_id });
  }
}
