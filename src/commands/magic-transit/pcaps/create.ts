import type { Context, MagicPCAP } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <pcap-json> is required.");

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

  const pcap = await ctx.client.post<MagicPCAP>(
    `/accounts/${encodeURIComponent(accountId)}/magic/pcaps`,
    body,
  );

  ctx.output.success(`Packet capture created (ID: ${pcap.id}).`);
  ctx.output.detail({
    "ID": pcap.id,
    "Type": pcap.type,
    "System": pcap.system,
    "Status": pcap.status,
  });
}
