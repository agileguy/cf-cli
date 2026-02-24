import type { Context, GatewayDLPProfile } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveGatewayScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { accountId, flags } = await resolveGatewayScope(args, ctx);

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <dlp-json> is required.");

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

  const profile = await ctx.client.post<GatewayDLPProfile>(
    `/accounts/${encodeURIComponent(accountId)}/dlp/profiles/custom`,
    body,
  );

  ctx.output.success(`DLP profile created: ${profile.id}`);
  ctx.output.detail({
    "ID": profile.id,
    "Name": profile.name,
    "Type": profile.type ?? "",
  });
}
