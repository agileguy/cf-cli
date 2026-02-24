import type { Context, AlertWebhook, ColumnDef } from "../../../types/index.js";
import { parseArgs, getStringFlag } from "../../../utils/args.js";
import { resolveAccountId } from "../../../utils/account-resolver.js";
import { UsageError } from "../../../utils/errors.js";
import { confirm } from "../../../utils/prompts.js";

const USAGE = `Usage: cf alerts destinations webhooks <command>

Commands:
  list      List webhook destinations
  create    Create a webhook destination
  update    Update a webhook destination
  delete    Delete a webhook destination

Run 'cf alerts destinations webhooks <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "list":
    case "ls":
      return listCmd(rest, ctx);
    case "create":
    case "add":
      return createCmd(rest, ctx);
    case "update":
      return updateCmd(rest, ctx);
    case "delete":
    case "rm":
      return deleteCmd(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown webhooks command: "${subcommand}"\n\n${USAGE}`);
  }
}

async function listCmd(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const webhooks = await ctx.client.get<AlertWebhook[]>(
    `/accounts/${encodeURIComponent(accountId)}/alerting/v3/destinations/webhooks`,
  );

  const columns: ColumnDef[] = [
    { key: "id", header: "ID", width: 36 },
    { key: "name", header: "Name", width: 30 },
    { key: "url", header: "URL", width: 50 },
  ];

  ctx.output.table(webhooks, columns);
}

async function createCmd(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const name = getStringFlag(flags, "name");
  if (!name) throw new UsageError("--name <name> is required.");

  const url = getStringFlag(flags, "url");
  if (!url) throw new UsageError("--url <url> is required.");

  const webhook = await ctx.client.post<AlertWebhook>(
    `/accounts/${encodeURIComponent(accountId)}/alerting/v3/destinations/webhooks`,
    { name, url },
  );

  ctx.output.success(`Webhook created: ${webhook.id}`);
  ctx.output.detail({
    "ID": webhook.id,
    "Name": webhook.name,
    "URL": webhook.url,
  });
}

async function updateCmd(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <webhook-id> is required.");

  const body: Record<string, string> = {};
  const name = getStringFlag(flags, "name");
  const url = getStringFlag(flags, "url");
  if (name) body.name = name;
  if (url) body.url = url;

  const webhook = await ctx.client.put<AlertWebhook>(
    `/accounts/${encodeURIComponent(accountId)}/alerting/v3/destinations/webhooks/${encodeURIComponent(id)}`,
    body,
  );

  ctx.output.success(`Webhook "${id}" updated.`);
  ctx.output.detail({
    "ID": webhook.id,
    "Name": webhook.name,
    "URL": webhook.url,
  });
}

async function deleteCmd(args: string[], ctx: Context): Promise<void> {
  const { flags } = parseArgs(args);

  const accountId = await resolveAccountId(
    getStringFlag(flags, "accountId"),
    ctx.client,
    ctx.config,
  );

  const id = getStringFlag(flags, "id");
  if (!id) throw new UsageError("--id <webhook-id> is required.");

  const confirmed = await confirm(`Delete webhook "${id}"?`, ctx.flags);
  if (!confirmed) {
    ctx.output.warn("Aborted.");
    return;
  }

  await ctx.client.delete<void>(
    `/accounts/${encodeURIComponent(accountId)}/alerting/v3/destinations/webhooks/${encodeURIComponent(id)}`,
  );

  ctx.output.success(`Webhook "${id}" deleted.`);
}
