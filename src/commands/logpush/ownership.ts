import type { Context, LogpushOwnershipValidation } from "../../types/index.js";
import { getStringFlag } from "../../utils/args.js";
import { resolveLogpushScope } from "./scope.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveLogpushScope(args, ctx);

  const destinationConf = getStringFlag(flags, "destinationConf");
  if (!destinationConf) throw new UsageError("--destination-conf <dest> is required.");

  const result = await ctx.client.post<LogpushOwnershipValidation>(
    `${basePath}/ownership/validate`,
    { destination_conf: destinationConf },
  );

  ctx.output.detail({
    "Valid": result.valid,
    "Filename": result.filename ?? "",
    "Message": result.message ?? "",
  });
}
