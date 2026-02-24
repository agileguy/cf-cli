import { readFileSync } from "fs";
import type { Context, DnsImportResult } from "../../types/index.js";
import { parseArgs, getStringFlag, getBoolFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  const file = getStringFlag(flags, "file");
  const proxied = getBoolFlag(flags, "proxied");

  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");
  if (!file) throw new UsageError("--file <path> is required. Use '-' for stdin.");

  const zoneId = await resolveZoneId(zone, ctx.client);

  let content: string;
  if (file === "-") {
    // Read from stdin
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk as Buffer);
    }
    content = Buffer.concat(chunks).toString("utf-8");
  } else {
    try {
      content = readFileSync(file, "utf-8");
    } catch (err) {
      throw new UsageError(
        `Cannot read file: ${file}. ${(err as Error).message}`,
      );
    }
  }

  const formData = new FormData();
  formData.set("file", new Blob([content], { type: "text/plain" }), "records.txt");
  if (proxied) {
    formData.set("proxied", "true");
  }

  const result = await ctx.client.upload(
    `/zones/${zoneId}/dns_records/import`,
    formData,
  ) as DnsImportResult;

  ctx.output.success(
    `DNS import complete: ${result.recs_added} records added out of ${result.total_records_parsed} parsed.`,
  );
}
