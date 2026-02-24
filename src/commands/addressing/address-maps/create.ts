import type { Context, AddressMap } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <map-json> is required.");

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

  const map = await ctx.client.post<AddressMap>(
    `/accounts/${encodeURIComponent(accountId)}/addressing/address_maps`,
    body,
  );

  ctx.output.success(`Address map created: ${map.id}`);
  ctx.output.detail({
    "ID": map.id,
    "Description": map.description ?? "",
    "Enabled": map.enabled ?? false,
  });
}
