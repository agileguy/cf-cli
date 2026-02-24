import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const index = getStringFlag(flags, "index");
  if (!index) throw new UsageError("--index <name> is required.");

  const property = getStringFlag(flags, "property");
  if (!property) throw new UsageError("--property <name> is required.");

  const type = getStringFlag(flags, "type");
  if (!type) throw new UsageError("--type <type> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  await ctx.client.post<unknown>(
    `/accounts/${encodeURIComponent(accountId)}/vectorize/v2/indexes/${encodeURIComponent(index)}/metadata_index`,
    { property_name: property, index_type: type },
  );

  ctx.output.success(`Metadata index on "${property}" (type: ${type}) created for "${index}".`);
}
