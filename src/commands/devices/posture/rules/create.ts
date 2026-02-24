import type { Context, DevicePostureRule } from "../../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../../utils/args.js";
import { resolveAccountId } from "../../../../utils/account-resolver.js";
import { UsageError } from "../../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

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
    throw new UsageError("File must contain valid JSON.");
  }

  const rule = await ctx.client.post<DevicePostureRule>(
    `/accounts/${encodeURIComponent(accountId)}/devices/posture`,
    body,
  );

  ctx.output.success(`Posture rule "${rule.name}" created.`);
  ctx.output.detail({
    "ID": rule.id,
    "Name": rule.name,
    "Type": rule.type,
  });
}
