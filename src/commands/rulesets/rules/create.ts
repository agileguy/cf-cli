import type { Context, Ruleset } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";
import { resolveScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveScope(args, ctx);

  const rulesetId = getStringFlag(flags, "ruleset");
  const file = getStringFlag(flags, "file");

  if (!rulesetId) throw new UsageError("--ruleset <ruleset-id> is required.");
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

  // The API expects rules array to be added to the ruleset
  const ruleset = await ctx.client.post<Ruleset>(
    `${basePath}/${encodeURIComponent(rulesetId)}/rules`,
    body,
  );

  const newRulesCount = ruleset.rules?.length ?? 0;
  ctx.output.success(`Rule added to ruleset ${rulesetId}. Total rules: ${newRulesCount}`);
}
