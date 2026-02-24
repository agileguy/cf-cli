import type { Context, Pipeline } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";
import { readFileSync } from "fs";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <pipeline-name> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <config-json> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  // Read and parse config file
  let configData: unknown;
  try {
    const content = readFileSync(file, "utf8");
    configData = JSON.parse(content);
  } catch (err: unknown) {
    if (err instanceof SyntaxError) {
      throw new UsageError(`File "${file}" does not contain valid JSON.`);
    }
    throw new UsageError(`Could not read file "${file}": ${err instanceof Error ? err.message : String(err)}`);
  }

  const body = {
    name,
    ...(configData as Record<string, unknown>),
  };

  const result = await ctx.client.post<Pipeline>(
    `/accounts/${encodeURIComponent(accountId)}/pipelines`,
    body,
  );

  ctx.output.success(`Pipeline "${result.name}" created (ID: ${result.id}).`);
}
