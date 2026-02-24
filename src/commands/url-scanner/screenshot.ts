import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <uuid> is required.");

  const outputFile = getStringFlag(flags, "outputFile");
  if (!outputFile) throw new UsageError("--output-file <path> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const url = `/accounts/${encodeURIComponent(accountId)}/urlscanner/scan/${encodeURIComponent(id)}/screenshot`;
  const data = await ctx.client.get<unknown>(url);

  if (typeof data === "string") {
    await Bun.write(outputFile, data);
  } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
    await Bun.write(outputFile, data);
  } else {
    await Bun.write(outputFile, JSON.stringify(data));
  }

  ctx.output.success(`Screenshot saved to "${outputFile}".`);
}
