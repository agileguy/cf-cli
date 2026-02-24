import type { Context } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";
import { resolveScope } from "../scope.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveScope(args, ctx);

  const rulesetId = getStringFlag(flags, "ruleset");
  const ruleId = getStringFlag(flags, "rule");

  if (!rulesetId) throw new UsageError("--ruleset <ruleset-id> is required.");
  if (!ruleId) throw new UsageError("--rule <rule-id> is required.");

  const confirmed = await confirm(
    `Delete rule ${ruleId} from ruleset ${rulesetId}?`,
    ctx.flags,
  );

  if (!confirmed) {
    ctx.output.info("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `${basePath}/${encodeURIComponent(rulesetId)}/rules/${encodeURIComponent(ruleId)}`,
  );

  ctx.output.success(`Rule ${ruleId} deleted from ruleset ${rulesetId}.`);
}
