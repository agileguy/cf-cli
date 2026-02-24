import type { Context, AccessCertificate } from "../../../types/index.js";
import { getStringFlag } from "../../../utils/args.js";
import { resolveAccountScope } from "../scope.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { basePath, flags } = await resolveAccountScope(args, ctx);

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <cert-json> is required.");

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

  const cert = await ctx.client.post<AccessCertificate>(
    `${basePath}/certificates`,
    body,
  );

  ctx.output.success(`Access certificate created: ${cert.id}`);
  ctx.output.detail({
    "ID": cert.id,
    "Name": cert.name,
    "Fingerprint": cert.fingerprint ?? "",
    "Hostnames": cert.associated_hostnames?.join(", ") ?? "",
  });
}
