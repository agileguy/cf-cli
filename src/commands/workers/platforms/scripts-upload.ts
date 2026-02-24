import { readFileSync } from "fs";
import type { Context, WorkerNamespaceScript } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const namespace = getStringFlag(flags, "namespace");
  const name = getStringFlag(flags, "name");
  const file = getStringFlag(flags, "file");

  if (!namespace) throw new UsageError("--namespace <namespace-name> is required.");
  if (!name) throw new UsageError("--name <script-name> is required.");
  if (!file) throw new UsageError("--file <script-file> is required.");

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

  // Build multipart form data
  const metadata = {
    main_module: "worker.js",
    body_part: "worker.js",
  };

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

  const result = await ctx.client.uploadPut<WorkerNamespaceScript>(
    `/accounts/${accountId}/workers/dispatch/namespaces/${namespace}/scripts/${name}`,
    formData,
  );

  ctx.output.success(`Script "${name}" uploaded to namespace "${namespace}".`);
  ctx.output.detail({
    "Name": result.id,
    "Created": result.created_on,
    "Modified": result.modified_on,
  });
}
