import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag, getBoolFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const database = getStringFlag(flags, "database");
  if (!database) throw new UsageError("--database <id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const body: Record<string, unknown> = {
    output_format: "file",
  };

  const noSchema = getBoolFlag(flags, "schema") === false;
  const noData = getBoolFlag(flags, "data") === false;
  if (noSchema) body["no_schema"] = true;
  if (noData) body["no_data"] = true;

  // D1 export is a two-step process: initiate then poll
  const exportResult = await ctx.client.post<{ filename: string; signed_url?: string }>(
    `/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(database)}/export`,
    body,
  );

  const outputFile = getStringFlag(flags, "outputFile");

  if (exportResult.signed_url) {
    if (outputFile) {
      // Download to file
      const response = await fetch(exportResult.signed_url);
      const content = await response.text();
      await Bun.write(outputFile, content);
      ctx.output.success(`Database exported to "${outputFile}".`);
    } else {
      // Download and print to stdout
      const response = await fetch(exportResult.signed_url);
      const content = await response.text();
      ctx.output.raw(content);
    }
  } else {
    ctx.output.success(`Export initiated. Filename: ${exportResult.filename}`);
  }
}
