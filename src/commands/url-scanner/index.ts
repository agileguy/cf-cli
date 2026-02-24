import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as scan from "./scan.js";
import * as bulk from "./bulk.js";
import * as get from "./get.js";
import * as search from "./search.js";
import * as har from "./har.js";
import * as screenshot from "./screenshot.js";
import * as dom from "./dom.js";

const USAGE = `Usage: cf url-scanner <command>

Commands:
  scan        Submit a URL for scanning
  bulk        Submit multiple URLs from a file
  get         Get scan result by ID
  search      Search scan results
  har         Get HAR archive for a scan
  screenshot  Download screenshot for a scan
  dom         Get DOM snapshot for a scan

Run 'cf url-scanner <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "scan":
      return scan.run(rest, ctx);
    case "bulk":
      return bulk.run(rest, ctx);
    case "get":
    case "show":
      return get.run(rest, ctx);
    case "search":
      return search.run(rest, ctx);
    case "har":
      return har.run(rest, ctx);
    case "screenshot":
      return screenshot.run(rest, ctx);
    case "dom":
      return dom.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown url-scanner command: "${subcommand}"\n\n${USAGE}`);
  }
}
