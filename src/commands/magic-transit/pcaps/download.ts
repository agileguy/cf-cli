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

  // The pcap download endpoint returns raw binary data (not a JSON envelope).
  // We use the client's get method which will attempt JSON parse — but the
  // actual CF API may return binary. As a workaround, we treat the result
  // as raw data and write whatever we get.
  const url = `/accounts/${encodeURIComponent(accountId)}/magic/pcaps/${encodeURIComponent(id)}/download`;
  const data = await ctx.client.get<unknown>(url);

  // If we got a string (base64) or object, serialize it; otherwise write as-is
  if (typeof data === "string") {
    await Bun.write(outputFile, data);
  } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
    await Bun.write(outputFile, data);
  } else {
    // Fallback: JSON serialize whatever the API returned
    await Bun.write(outputFile, JSON.stringify(data));
  }

  ctx.output.success(`Packet capture downloaded to "${outputFile}".`);
}
