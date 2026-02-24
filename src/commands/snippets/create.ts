import type { Context, Snippet } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveZoneId } from "../../utils/zone-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const zone = getStringFlag(flags, "zone");
  if (!zone) throw new UsageError("--zone <zone-id-or-name> is required.");

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <snippet-name> is required.");

  const file = getStringFlag(flags, "file");
  if (!file) throw new UsageError("--file <js-file> is required.");

  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch {
    throw new UsageError(`Cannot read file: "${file}".`);
  }

  const zoneId = await resolveZoneId(zone, ctx.client);

  // Snippets use multipart form upload
  const formData = new FormData();
  formData.append("metadata", JSON.stringify({
    main_module: name,
  }));
  formData.append("module", new Blob([content], { type: "application/javascript" }), name);

  const snippet = await ctx.client.uploadPut<Snippet>(
    `/zones/${encodeURIComponent(zoneId)}/snippets/${encodeURIComponent(name)}`,
    formData,
  );

  ctx.output.success(`Snippet "${name}" created.`);
  ctx.output.detail({
    "Name": snippet.snippet_name,
    "Main Module": snippet.main_module,
  });
}
