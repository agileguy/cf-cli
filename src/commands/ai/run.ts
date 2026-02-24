import type { Context } from "../../types/index.js";
import { parseArgs, getStringFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags, positional } = parseArgs(args);

  const model = positional[0];
  if (!model) throw new UsageError("Model name is required as positional argument.\n\nUsage: cf ai run <model> [--prompt <text>] [--file <file>] [--output-file <path>] [--options <json>]");

  const prompt = getStringFlag(flags, "prompt");
  const file = getStringFlag(flags, "file");
  const outputFile = getStringFlag(flags, "outputFile");
  const optionsJson = getStringFlag(flags, "options");

  if (!prompt && !file) {
    throw new UsageError("Either --prompt <text> or --file <file> is required.");
  }

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  // Build request body
  let body: unknown;

  if (file) {
    // Read file and send as binary content
    let bytes: ArrayBuffer;
    try {
      bytes = await Bun.file(file).arrayBuffer();
    } catch {
      throw new UsageError(`Cannot read file: "${file}".`);
    }
    body = Array.from(new Uint8Array(bytes));
  } else if (prompt) {
    // Text-based inference
    body = { messages: [{ role: "user", content: prompt }] };
  }

  // Merge extra options if provided
  if (optionsJson) {
    let extraOptions: Record<string, unknown>;
    try {
      extraOptions = JSON.parse(optionsJson) as Record<string, unknown>;
    } catch {
      throw new UsageError(`Invalid JSON for --options: "${optionsJson}".`);
    }
    if (Array.isArray(body)) {
      throw new UsageError("--options cannot be used with --file.");
    }
    if (typeof body === "object" && body !== null) {
      body = { ...(body as Record<string, unknown>), ...extraOptions };
    }
  }

  const result = await ctx.client.post<unknown>(
    `/accounts/${encodeURIComponent(accountId)}/ai/run/${model}`,
    body,
  );

  // Handle response based on type
  if (outputFile && result) {
    // Binary output (image generation etc.) - write to file
    try {
      const data = typeof result === "string" ? result : JSON.stringify(result);
      await Bun.write(outputFile, data);
      ctx.output.success(`Output written to "${outputFile}".`);
    } catch {
      throw new UsageError(`Cannot write to file: "${outputFile}".`);
    }
    return;
  }

  // Text response
  if (result && typeof result === "object" && "response" in (result as Record<string, unknown>)) {
    ctx.output.raw((result as Record<string, unknown>).response);
    return;
  }

  // Fallback: output whatever we got
  if (typeof result === "string") {
    ctx.output.raw(result);
  } else {
    ctx.output.json(result);
  }
}
