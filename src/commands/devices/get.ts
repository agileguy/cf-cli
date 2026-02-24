import type { Context, ZTDevice } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <device-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const device = await ctx.client.get<ZTDevice>(
    `/accounts/${encodeURIComponent(accountId)}/devices/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": device.id,
    "Name": device.name ?? "",
    "Type": device.device_type ?? "",
    "Version": device.version ?? "",
    "IP": device.ip ?? "",
    "MAC": device.mac_address ?? "",
    "OS": device.os_version ?? "",
    "Serial": device.serial_number ?? "",
    "User": device.user?.email ?? "",
    "Last Seen": device.last_seen ?? "",
    "Created": device.created ?? "",
  });
}
