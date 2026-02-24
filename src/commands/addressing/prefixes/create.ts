import type { Context, AddressPrefix } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <prefix-json> is required.");

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

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const prefix = await ctx.client.post<AddressPrefix>(
    `/accounts/${encodeURIComponent(accountId)}/addressing/prefixes`,
    body,
  );

  ctx.output.success(`Prefix created: ${prefix.id}`);
  ctx.output.detail({
    "ID": prefix.id,
    "CIDR": prefix.cidr,
    "Description": prefix.description ?? "",
  });
}
