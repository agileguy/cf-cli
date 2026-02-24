import type { Context, CfdTunnelConfig } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <tunnel-id> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <config-yaml> is required.");

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

  const config = await ctx.client.put<CfdTunnelConfig>(
    `/accounts/${encodeURIComponent(accountId)}/cfd_tunnel/${encodeURIComponent(id)}/configurations`,
    body,
  );

  ctx.output.success(`Tunnel "${id}" configuration updated.`);
  ctx.output.json(config);
}
