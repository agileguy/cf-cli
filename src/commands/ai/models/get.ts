import type { Context, AIModel } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const model = getStringFlag(flags, "model");
  if (!model) throw new UsageError("--model <model-id> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  // The models search endpoint can filter by name
  const models = await ctx.client.get<AIModel[]>(
    `/accounts/${encodeURIComponent(accountId)}/ai/models/search`,
    { search: model },
  );

  // Find exact match
  const found = Array.isArray(models)
    ? models.find((m) => m.name === model || m.id === model)
    : undefined;

  if (!found) {
    throw new UsageError(`Model "${model}" not found.`);
  }

  ctx.output.detail({
    "ID": found.id,
    "Name": found.name,
    "Description": found.description ?? "-",
    "Task": found.task?.name ?? "-",
    "Properties": found.properties
      ? found.properties.map((p) => `${p.property_id}=${p.value}`).join(", ")
      : "-",
  });
}
