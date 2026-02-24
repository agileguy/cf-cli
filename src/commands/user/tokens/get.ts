import type { Context, UserToken } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <token-id> is required.");

  const token = await ctx.client.get<UserToken>(
    `/user/tokens/${encodeURIComponent(id)}`,
  );

  ctx.output.detail({
    "ID": token.id,
    "Name": token.name,
    "Status": token.status ?? "-",
    "Issued On": token.issued_on ?? "-",
    "Modified On": token.modified_on ?? "-",
    "Not Before": token.not_before ?? "-",
    "Expires On": token.expires_on ?? "never",
    "Policies": token.policies ? JSON.stringify(token.policies, null, 2) : "-",
  });
}
