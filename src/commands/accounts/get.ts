import type { Context, Account } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");

  if (!id) {
    throw new UsageError("--id <account-id> is required.");
  }

  const account = await ctx.client.get<Account>(`/accounts/${id}`);

  ctx.output.detail({
    "ID": account.id,
    "Name": account.name,
    "Type": account.type,
    "Enforce 2FA": account.settings.enforce_twofactor,
    "Created": account.created_on,
  });
}
