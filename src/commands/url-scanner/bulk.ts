import type { Context, URLScanResult } from "../../types/index.js";
import { parseArgs, getStringFlag, getBoolFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <urls-file> is required.");

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

  const isPublic = getBoolFlag(flags, "public");
  const visibility = isPublic ? "Public" : "Private";

  const urls = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (urls.length === 0) {
    throw new UsageError("File contains no URLs.");
  }

  const results: URLScanResult[] = [];
  for (const url of urls) {
    const result = await ctx.client.post<URLScanResult>(
      `/accounts/${encodeURIComponent(accountId)}/urlscanner/scan`,
      { url, visibility },
    );
    results.push(result);
  }

  ctx.output.json(results);
}
