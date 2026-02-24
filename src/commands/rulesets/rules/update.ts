import type { Context, Ruleset } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";
import { resolveScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveScope(args, ctx);

  const rulesetId = getStringFlag(flags, "ruleset");
  const ruleId = getStringFlag(flags, "rule");
  const file = getStringFlag(flags, "file");

  if (!rulesetId) throw new UsageError("--ruleset <ruleset-id> is required.");
  if (!ruleId) throw new UsageError("--rule <rule-id> is required.");
  if (!file) throw new UsageError("--file <rule-json> is required.");

  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  let body: unknown;
  try {
    body = JSON.parse(content);
  } catch {
    throw new UsageError("File must contain valid JSON.");
  }

  const ruleset = await ctx.client.patch<Ruleset>(
    `${basePath}/${encodeURIComponent(rulesetId)}/rules/${encodeURIComponent(ruleId)}`,
    body,
  );

  ctx.output.success(`Rule ${ruleId} updated in ruleset ${rulesetId}. Total rules: ${ruleset.rules?.length ?? 0}`);
}
