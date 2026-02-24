import type { Context, ColumnDef } from "../../types/index.js";
import { readConfig } from "../../config.js";

export async function run(_args: string[], ctx: Context): Promise<void> {
  const config = readConfig();

  const profiles = Object.entries(config.profiles).map(([name, profile]) => ({
    name,
    auth_method: profile.auth_method,
    email: profile.email ?? "-",
    account_id: profile.account_id ?? "-",
    is_default: name === config.default_profile ? "Yes" : "",
  }));

  if (profiles.length === 0) {
    ctx.output.info("No profiles configured. Run: cf config set --profile <name> --token <token>");
    return;
  }

  const columns: ColumnDef[] = [
    { key: "name", header: "Profile", width: 20 },
    { key: "auth_method", header: "Auth", width: 8 },
    { key: "email", header: "Email", width: 30 },
    { key: "account_id", header: "Account ID", width: 34 },
    { key: "is_default", header: "Default", width: 8 },
  ];

  ctx.output.table(profiles, columns);
}
