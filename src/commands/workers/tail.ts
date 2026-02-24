import type { Context, WorkerTail, WorkerTailEvent } from "../../types/index.js";
import { parseArgs, getStringFlag, getNumberFlag } from "../../utils/args.js";
import { resolveAccountId } from "../../utils/account-resolver.js";
import { UsageError } from "../../utils/errors.js";

export async function run(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const name = getStringFlag(flags, "name");
  const format = getStringFlag(flags, "format") ?? "pretty";
  const samplingRate = getNumberFlag(flags, "samplingRate");

  if (!name) throw new UsageError("--name <script-name> is required.");
  if (format !== "json" && format !== "pretty") {
    throw new UsageError('--format must be "json" or "pretty".');
  }
  if (samplingRate !== undefined && (samplingRate < 0 || samplingRate > 1)) {
    throw new UsageError("--sampling-rate must be between 0.0 and 1.0.");
  }

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  // Create the tail session
  const body: Record<string, unknown> = {};
  if (samplingRate !== undefined) {
    body["filters"] = [{ sampling_rate: samplingRate }];
  }

  const tail = await ctx.client.post<WorkerTail>(
    `/accounts/${accountId}/workers/scripts/${name}/tails`,
    Object.keys(body).length > 0 ? body : undefined,
  );

  ctx.output.info(`Tail session created for "${name}". WebSocket URL: ${tail.url}`);
  ctx.output.info(`Tail ID: ${tail.id} (expires: ${tail.expires_at})`);

  // Connect to the WebSocket
  try {
    const ws = new WebSocket(tail.url);

    ws.addEventListener("open", () => {
      ctx.output.info("Connected. Streaming logs (Ctrl+C to stop)...\n");
    });

    ws.addEventListener("message", (event: MessageEvent) => {
      try {
        const data = JSON.parse(String(event.data)) as WorkerTailEvent;
        if (format === "json") {
          process.stdout.write(JSON.stringify(data) + "\n");
        } else {
          formatTailEvent(data);
        }
      } catch {
        process.stdout.write(String(event.data) + "\n");
      }
    });

    ws.addEventListener("error", (event: Event) => {
      ctx.output.error(`WebSocket error: ${String(event)}`);
    });

    ws.addEventListener("close", () => {
      ctx.output.info("Tail session closed.");
    });

    // Keep process alive and handle Ctrl+C
    const cleanup = (): void => {
      ws.close();
      // Delete the tail session
      ctx.client
        .delete<void>(
          `/accounts/${accountId}/workers/scripts/${name}/tails/${tail.id}`,
        )
        .catch(() => {
          // Best-effort cleanup
        });
    };

    process.on("SIGINT", () => {
      cleanup();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      cleanup();
      process.exit(0);
    });

    // Keep process alive
    await new Promise<void>((resolve) => {
      ws.addEventListener("close", () => resolve());
    });
  } catch (err) {
    ctx.output.error(
      `Failed to connect to tail WebSocket: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/** Format a tail event in pretty format */
function formatTailEvent(event: WorkerTailEvent): void {
  const ts = event.eventTimestamp
    ? new Date(event.eventTimestamp).toISOString()
    : new Date().toISOString();
  const outcome = event.outcome === "ok" ? "OK" : event.outcome.toUpperCase();

  process.stdout.write(`[${ts}] ${outcome}`);
  if (event.scriptName) {
    process.stdout.write(` (${event.scriptName})`);
  }
  process.stdout.write("\n");

  for (const log of event.logs) {
    const logTs = new Date(log.timestamp).toISOString();
    process.stdout.write(`  [${logTs}] ${log.level}: ${log.message.join(" ")}\n`);
  }

  for (const exc of event.exceptions) {
    const excTs = new Date(exc.timestamp).toISOString();
    process.stdout.write(`  [${excTs}] EXCEPTION: ${exc.name}: ${exc.message}\n`);
  }
}
