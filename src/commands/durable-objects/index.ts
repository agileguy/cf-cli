import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as namespacesListCmd from "./namespaces-list.js";
import * as objectsListCmd from "./objects-list.js";

const USAGE = `Usage: cf durable-objects <subresource> <command>

Subresources:
  namespaces  Manage Durable Object namespaces
    list        List all Durable Object namespaces
  list          List objects in a Durable Object namespace

Run 'cf durable-objects <subresource> <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subresource, ...rest] = args;

  switch (subresource) {
    case "namespaces":
    case "namespace":
    case "ns": {
      const [nsAction, ...nsRest] = rest;
      switch (nsAction) {
        case "list":
        case "ls":
          return namespacesListCmd.run(nsRest, ctx);
        case undefined:
        case "--help":
        case "-h":
          ctx.output.raw(USAGE);
          return;
        default:
          throw new UsageError(`Unknown durable-objects namespaces command: "${nsAction}"\n\n${USAGE}`);
      }
    }
    case "list":
    case "ls":
      return objectsListCmd.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown durable-objects subresource: "${subresource}"\n\n${USAGE}`);
  }
}
