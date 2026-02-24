import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <pcap-id> is required.");

  const outputFile = getStringFlag(flags, "outputFile");
  if (!outputFile) throw new UsageError("--output-file <path> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  // The pcap download endpoint returns binary data, so we get it as a string
  // (the client wraps it in a JSON response). We use the get method which
  // will return the result field from the Cloudflare response envelope.
  const data = await ctx.client.get<string>(
    `/accounts/${encodeURIComponent(accountId)}/magic/pcaps/${encodeURIComponent(id)}/download`,
  );

  await Bun.write(outputFile, data);

  ctx.output.success(`Packet capture downloaded to "${outputFile}".`);
}
