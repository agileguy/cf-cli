import type { Context, MagicPCAP } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <pcap-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const pcap = await ctx.client.get<MagicPCAP>(
    `/accounts/${encodeURIComponent(accountId)}/magic/pcaps/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": pcap.id,
    "Type": pcap.type,
    "System": pcap.system,
    "Status": pcap.status,
    "Colo": pcap.colo_name ?? "",
    "Time Limit": pcap.time_limit ?? "",
    "Byte Limit": pcap.byte_limit ?? "",
    "Packet Limit": pcap.packet_limit ?? "",
    "Error": pcap.error_message ?? "",
    "Created": pcap.created_on ?? "",
    "Modified": pcap.modified_on ?? "",
  });
}
