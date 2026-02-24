import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as domain from "./domain.js";
import * as ip from "./ip.js";
import * as asn from "./asn.js";
import * as dns from "./dns.js";
import * as whois from "./whois.js";
import * as ipLists from "./ip-lists.js";
import * as attackSurface from "./attack-surface.js";

const USAGE = `Usage: cf intel <command>

Commands:
  domain          Lookup domain intelligence
  ip              Lookup IP intelligence
  asn             Lookup ASN intelligence
  dns             Passive DNS lookup
  whois           WHOIS lookup
  ip-lists        List known IP lists
  attack-surface  View attack surface report

Run 'cf intel <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "domain":
      return domain.run(rest, ctx);
    case "ip":
      return ip.run(rest, ctx);
    case "asn":
      return asn.run(rest, ctx);
    case "dns":
      return dns.run(rest, ctx);
    case "whois":
      return whois.run(rest, ctx);
    case "ip-lists":
      return ipLists.run(rest, ctx);
    case "attack-surface":
      return attackSurface.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown intel command: "${subcommand}"\n\n${USAGE}`);
  }
}
