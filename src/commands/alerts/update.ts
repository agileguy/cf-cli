import type { Context, AlertPolicy } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <policy-id> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <alert-json> is required.");

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

  const policy = await ctx.client.put<AlertPolicy>(
    `/accounts/${encodeURIComponent(accountId)}/alerting/v3/policies/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Alert policy "${id}" updated.`);
  ctx.output.detail({
    "ID": policy.id,
    "Name": policy.name,
    "Alert Type": policy.alert_type,
    "Enabled": policy.enabled ?? true,
  });
}
