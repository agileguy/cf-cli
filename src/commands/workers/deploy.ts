import { readFileSync } from "fs";
import type { Context, WorkerScript } from "../../types/index.js";
import { parseArgs, getStringFlag, getListFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags, positional } = parseArgs(args);

  const file = positional[0] ?? getStringFlag(flags, "file");
  const name = getStringFlag(flags, "name");
  const compatDate = getStringFlag(flags, "compatibilityDate");
  const compatFlags = getListFlag(flags, "compatibilityFlag");

  if (!file) throw new UsageError("<file> argument or --file is required.");
  if (!name) throw new UsageError("--name <script-name> is required.");

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  // Read the script file
  let scriptContent: string;
  try {
    scriptContent = readFileSync(file, "utf-8");
  } catch (err) {
    throw new UsageError(
      `Could not read file "${file}": ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Build metadata for the worker
  const metadata: Record<string, unknown> = {
    main_module: "worker.js",
    body_part: "worker.js",
  };

  if (compatDate) {
    metadata["compatibility_date"] = compatDate;
  }
  if (compatFlags && compatFlags.length > 0) {
    metadata["compatibility_flags"] = compatFlags;
  }

  // Build multipart form data
  const formData = new FormData();
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" }),
  );
  formData.append(
    "worker.js",
    new Blob([scriptContent], { type: "application/javascript+module" }),
    "worker.js",
  );

  const result = await ctx.client.uploadPut<WorkerScript>(
    `/accounts/${accountId}/workers/scripts/${name}`,
    formData,
  );

  ctx.output.success(`Worker "${name}" deployed successfully.`);
  ctx.output.detail({
    "Name": result.id,
    "ETag": result.etag,
    "Handlers": result.handlers.join(", "),
    "Modified": result.modified_on,
  });
}
