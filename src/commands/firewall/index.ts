import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as ipRules from "./ip-rules/index.js";
import * as uaRules from "./ua-rules/index.js";
import * as zoneLockdowns from "./zone-lockdowns/index.js";

const USAGE = `Usage: cf firewall <command>

Commands:
  ip-rules         Manage IP access rules (block, challenge, whitelist)
  ua-rules         Manage User-Agent blocking rules
  zone-lockdowns   Manage zone lockdown rules

Run 'cf firewall <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "ip-rules":
    case "ip-rule":
    case "access-rules":
      return ipRules.run(rest, ctx);
    case "ua-rules":
    case "ua-rule":
      return uaRules.run(rest, ctx);
    case "zone-lockdowns":
    case "zone-lockdown":
    case "lockdowns":
    case "lockdown":
      return zoneLockdowns.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown firewall command: "${subcommand}"\n\n${USAGE}`);
  }
}
