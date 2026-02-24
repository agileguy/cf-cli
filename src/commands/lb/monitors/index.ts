import type { Context } from "../../../types/index.js";
import { UsageError } from "../../../utils/errors.js";

import * as list from "./list.js";
import * as get from "./get.js";
import * as create from "./create.js";
import * as update from "./update.js";
import * as del from "./delete.js";
import * as preview from "./preview.js";
import * as references from "./references.js";

const USAGE = `Usage: cf lb monitors <action>

Actions:
  list        List load balancer monitors
  get         Get monitor details
  create      Create a monitor from JSON file
  update      Update a monitor (full replace)
  delete      Delete a monitor
  preview     Preview a monitor
  references  List monitor references (pools using this monitor)`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [action, ...rest] = args;

  switch (action) {
    case "list":
    case "ls":
      return list.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "create":
      return create.run(rest, ctx);
    case "update":
      return update.run(rest, ctx);
    case "delete":
    case "rm":
      return del.run(rest, ctx);
    case "preview":
      return preview.run(rest, ctx);
    case "references":
    case "refs":
      return references.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown lb monitors action: "${action}"\n\n${USAGE}`);
  }
}
