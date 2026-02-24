import type { Context, Zone } from "../../types/index.js";
import { parseArgs, getStringFlag, getBoolFlag } from "../../utils/args.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  const accountId = getStringFlag(flags, "accountId");
  const jumpStart = getBoolFlag(flags, "jumpStart");
  const type = getStringFlag(flags, "type");

  if (!name) {
    throw new UsageError("--name <domain> is required.");
  }
  if (!accountId) {
    throw new UsageError("--account-id <id> is required.");
  }

  const body: Record<string, unknown> = {
    name,
    account: { id: accountId },
    jump_start: jumpStart,
  };
  if (type) {
    body["type"] = type;
  }

  const zone = await ctx.client.post<Zone>("/zones", body);

  ctx.output.success(`Zone created: ${zone.id}`);
  ctx.output.detail({
    "ID": zone.id,
    "Name": zone.name,
    "Status": zone.status,
    "Name Servers": zone.name_servers.join(", "),
  });
}
