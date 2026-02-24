import type { Context, MagicIPsecPSK } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <tunnel-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const result = await ctx.client.post<MagicIPsecPSK>(
    `/accounts/${encodeURIComponent(accountId)}/magic/ipsec_tunnels/${encodeURIComponent(id)}/psk_generate`,
  );

  ctx.output.success("Pre-shared key generated.");
  ctx.output.detail({
    "PSK": result.psk,
    "Generated On": result.psk_metadata?.last_generated_on ?? "",
  });
}
