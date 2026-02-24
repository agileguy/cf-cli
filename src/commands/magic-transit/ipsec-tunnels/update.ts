import type { Context, MagicIPsecTunnel } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <tunnel-id> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <tunnel-json> is required.");

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

  const result = await ctx.client.put<{ modified_ipsec_tunnel: MagicIPsecTunnel }>(
    `/accounts/${encodeURIComponent(accountId)}/magic/ipsec_tunnels/${encodeURIComponent(id)}`,
    body,
  );

  const tunnel = result.modified_ipsec_tunnel;
  ctx.output.success(`IPsec tunnel "${tunnel.name}" updated.`);
  ctx.output.detail({
    "ID": tunnel.id,
    "Name": tunnel.name,
  });
}
