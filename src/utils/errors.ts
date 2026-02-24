/** Known Cloudflare error codes and their user-friendly suggestions */
const ERROR_SUGGESTIONS: Record<number, string> = {
  6003: "Invalid or expired API token. Re-authenticate with: cf config set-profile",
  6100: "Invalid API key format. Check your key with: cf config show",
  6111: "Invalid or expired API key. Re-authenticate with: cf config set-profile",
  6112: "Invalid email + API key combination. Verify your credentials.",
  7000: "No route for the given URI. Check the command syntax.",
  7003: "Zone not found. Verify the zone ID or domain with: cf zones list",
  7001: "Method not allowed. This endpoint may not support that operation.",
  9103: "DNS record not found. Verify the record ID with: cf dns list",
  9104: "DNS record already exists. Use 'cf dns update' instead.",
  10000: "Authentication error. Re-authenticate with: cf config set-profile",
};

export class CloudflareAPIError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: number;
  public readonly errors: { code: number; message: string }[];

  constructor(
    statusCode: number,
    errorCode: number,
    errors: { code: number; message: string }[],
  ) {
    const primaryMessage =
      errors.length > 0
        ? errors.map((e) => `[${e.code}] ${e.message}`).join("; ")
        : `HTTP ${statusCode}`;
    super(primaryMessage);
    this.name = "CloudflareAPIError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
  }

  /** Get a user-friendly suggestion for the error */
  getSuggestion(): string | null {
    for (const err of this.errors) {
      const suggestion = ERROR_SUGGESTIONS[err.code];
      if (suggestion) return suggestion;
    }
    return null;
  }

  /** Format error for display */
  format(): string {
    const lines: string[] = [`API Error (HTTP ${this.statusCode})`];
    for (const err of this.errors) {
      lines.push(`  [${err.code}] ${err.message}`);
    }
    const suggestion = this.getSuggestion();
    if (suggestion) {
      lines.push(`  Suggestion: ${suggestion}`);
    }
    return lines.join("\n");
  }
}

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
