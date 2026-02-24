import type { Context, AIFineTune } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const model = getStringFlag(flags, "model");
  if (!model) throw new UsageError("--model <model-id> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <training-jsonl> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  // Read training file
  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  const job = await ctx.client.post<AIFineTune>(
    `/accounts/${encodeURIComponent(accountId)}/ai/finetunes`,
    { model, training_data: content },
  );

  ctx.output.success(`Fine-tuning job created (ID: ${job.id}).`);
}
