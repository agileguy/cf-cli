import type { Context, Pipeline } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

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
  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch (err: unknown) {
    throw new UsageError(`Could not read file "${file}": ${err instanceof Error ? err.message : String(err)}`);
  }
  try {
    configData = JSON.parse(content);
  } catch {
    throw new UsageError(`File "${file}" does not contain valid JSON.`);
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
