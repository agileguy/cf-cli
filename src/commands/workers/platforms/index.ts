import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as namespacesList from "./namespaces-list.js";
import * as namespacesGet from "./namespaces-get.js";
import * as scriptsList from "./scripts-list.js";
import * as scriptsUpload from "./scripts-upload.js";
import * as scriptsDel from "./scripts-delete.js";

const USAGE = `Usage: cf workers platforms <subresource> <command>

Subresources:
  namespaces    Manage dispatch namespaces
    list        List all dispatch namespaces
    get         Get a dispatch namespace by ID

  scripts       Manage namespace scripts
    list        List scripts in a namespace
    upload      Upload a script to a namespace
    delete      Delete a script from a namespace

Run 'cf workers platforms <subresource> <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subresource, subcommand, ...rest] = args;

  if (!subresource || subresource === "--help" || subresource === "-h") {
    ctx.output.raw(USAGE);
    return;
  }

  if (subresource === "namespaces" || subresource === "namespace" || subresource === "ns") {
    switch (subcommand) {
      case "list":
      case "ls":
        return namespacesList.run(rest, ctx);
      case "get":
      case "show":
        return namespacesGet.run(rest, ctx);
      case undefined:
      case "--help":
      case "-h":
        ctx.output.raw(USAGE);
        return;
      default:
        throw new UsageError(`Unknown platforms namespaces command: "${subcommand}"\n\n${USAGE}`);
    }
  }

  if (subresource === "scripts" || subresource === "script") {
    switch (subcommand) {
      case "list":
      case "ls":
        return scriptsList.run(rest, ctx);
      case "upload":
      case "deploy":
        return scriptsUpload.run(rest, ctx);
      case "delete":
      case "rm":
      case "remove":
        return scriptsDel.run(rest, ctx);
      case undefined:
      case "--help":
      case "-h":
        ctx.output.raw(USAGE);
        return;
      default:
        throw new UsageError(`Unknown platforms scripts command: "${subcommand}"\n\n${USAGE}`);
    }
  }

  throw new UsageError(`Unknown platforms subresource: "${subresource}"\n\n${USAGE}`);
}
