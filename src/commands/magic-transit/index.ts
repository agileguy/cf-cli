import type { Context } from "../../types/index.js";
import { UsageError } from "../../utils/errors.js";

import * as greTunnels from "./gre-tunnels/index.js";
import * as ipsecTunnels from "./ipsec-tunnels/index.js";
import * as sites from "./sites/index.js";
import * as routes from "./routes/index.js";
import * as acls from "./acls/index.js";
import * as pcaps from "./pcaps/index.js";

const USAGE = `Usage: cf magic-transit <command>

Commands:
  gre-tunnels    Manage GRE tunnels (list, get, create, update, delete)
  ipsec-tunnels  Manage IPsec tunnels (list, get, create, update, delete, generate-psk)
  sites          Manage Magic WAN sites (list, get, create, update, delete, lans, wans)
  routes         Manage static routes (list, create, update, delete)
  acls           Manage ACLs (list, create, update, delete)
  pcaps          Manage packet captures (list, get, create, download)

Run 'cf magic-transit <command> --help' for more information.`;

export async function run(args: string[], ctx: Context): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "gre-tunnels":
    case "gre":
      return greTunnels.run(rest, ctx);
    case "ipsec-tunnels":
    case "ipsec":
      return ipsecTunnels.run(rest, ctx);
    case "sites":
    case "site":
      return sites.run(rest, ctx);
    case "routes":
    case "route":
      return routes.run(rest, ctx);
    case "acls":
    case "acl":
      return acls.run(rest, ctx);
    case "pcaps":
    case "pcap":
      return pcaps.run(rest, ctx);
    case undefined:
    case "--help":
    case "-h":
      ctx.output.raw(USAGE);
      return;
    default:
      throw new UsageError(`Unknown magic-transit command: "${subcommand}"\n\n${USAGE}`);
  }
}
