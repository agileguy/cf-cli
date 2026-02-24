import type { Context, MNMRule } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <rule-id> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <rule-json> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

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
    throw new UsageError(`File "${file}" does not contain valid JSON.`);
  }

  const rule = await ctx.client.patch<MNMRule>(
    `/accounts/${encodeURIComponent(accountId)}/mnm/rules/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`MNM rule "${rule.name}" updated.`);
  ctx.output.detail({
    "ID": rule.id,
    "Name": rule.name,
  });
}
