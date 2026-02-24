import type { Context, CFImageVariant } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <variant-id> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <variant-json> is required.");

  const accountId = await resolveAccountId(getStringFlag(flags, "accountId"), ctx.client, ctx.config);

  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new UsageError(`File "${file}" does not contain valid JSON.`);
  }

  const body = { id, options: parsed };

  const variant = await ctx.client.post<CFImageVariant>(
    `/accounts/${encodeURIComponent(accountId)}/images/v1/variants`,
    body,
  );

  ctx.output.success(`Variant created: ${variant.id}`);
}
