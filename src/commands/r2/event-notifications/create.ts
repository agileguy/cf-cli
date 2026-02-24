import type { Context } from "../../../types/index.js";
import { parseArgs, getStringFlag, getListFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const bucket = getStringFlag(flags, "bucket");
  if (!bucket) throw new UsageError("--bucket <name> is required.");

  const queue = getStringFlag(flags, "queue");
  if (!queue) throw new UsageError("--queue <queue-id> is required.");

  const eventTypes = getListFlag(flags, "eventTypes");
  if (!eventTypes || eventTypes.length === 0) {
    throw new UsageError("--event-types <type,...> is required (comma-separated).");
  }

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const rule: Record<string, unknown> = { actions: eventTypes, queue_id: queue };

  const prefix = getStringFlag(flags, "prefix");
  if (prefix) rule["prefix"] = prefix;

  const suffix = getStringFlag(flags, "suffix");
  if (suffix) rule["suffix"] = suffix;

  const body = { rules: [rule] };

  await ctx.client.put<void>(
    `/accounts/${encodeURIComponent(accountId)}/event_notifications/r2/${encodeURIComponent(bucket)}/configuration/queues/${encodeURIComponent(queue)}`,
    body,
  );

  ctx.output.success(`Event notification rule created for bucket "${bucket}" -> queue "${queue}".`);
}
