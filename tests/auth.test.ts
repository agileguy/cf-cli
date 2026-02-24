import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { loadCredentials } from "../src/auth.js";
import { AuthError } from "../src/utils/errors.js";
import type { Config } from "../src/types/index.js";

function makeConfig(overrides?: Partial<Config>): Config {
  return {
    version: 1,
    default_profile: "default",
    profiles: {},
    defaults: { output: "table", no_color: false, per_page: 20 },
    ...overrides,
  };
}

describe("loadCredentials", () => {
  // Save and restore env vars
  const savedEnv: Record<string, string | undefined> = {};
  const envKeys = ["CF_PROFILE", "CF_API_TOKEN", "CF_API_KEY", "CF_API_EMAIL"];

  beforeEach(() => {
    for (const key of envKeys) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of envKeys) {
      if (savedEnv[key] !== undefined) {
        process.env[key] = savedEnv[key];
      } else {
        delete process.env[key];
      }
    }
  });

  describe("resolution order", () => {
    test("1. --profile flag takes highest priority", () => {
      // Also set env to prove profile wins
      process.env["CF_API_TOKEN"] = "env-token";

      const config = makeConfig({
        profiles: {
          staging: {
            auth_method: "token",
            token: "profile-staging-token",
          },
          default: {
            auth_method: "token",
            token: "profile-default-token",
          },
        },
      });

      const creds = loadCredentials("staging", config);
      expect(creds.method).toBe("token");
      expect(creds.token).toBe("profile-staging-token");
    });

    test("2. CF_PROFILE env selects a profile", () => {
      process.env["CF_PROFILE"] = "production";

      const config = makeConfig({
        profiles: {
          production: {
            auth_method: "key",
            api_key: "prod-key",
            email: "prod@example.com",
          },
        },
      });

      const creds = loadCredentials(undefined, config);
      expect(creds.method).toBe("key");
      expect(creds.apiKey).toBe("prod-key");
      expect(creds.email).toBe("prod@example.com");
    });

    test("3. CF_API_TOKEN env provides direct token", () => {
      process.env["CF_API_TOKEN"] = "direct-env-token";

      const config = makeConfig(); // no profiles
      const creds = loadCredentials(undefined, config);
      expect(creds.method).toBe("token");
      expect(creds.token).toBe("direct-env-token");
    });

    test("4. CF_API_KEY + CF_API_EMAIL env provides direct key", () => {
      process.env["CF_API_KEY"] = "direct-env-key";
      process.env["CF_API_EMAIL"] = "direct@example.com";

      const config = makeConfig();
      const creds = loadCredentials(undefined, config);
      expect(creds.method).toBe("key");
      expect(creds.apiKey).toBe("direct-env-key");
      expect(creds.email).toBe("direct@example.com");
    });

    test("5. default profile from config", () => {
      const config = makeConfig({
        default_profile: "default",
        profiles: {
          default: {
            auth_method: "token",
            token: "config-default-token",
          },
        },
      });

      const creds = loadCredentials(undefined, config);
      expect(creds.method).toBe("token");
      expect(creds.token).toBe("config-default-token");
    });

    test("6. throws AuthError when no credentials found", () => {
      const config = makeConfig();
      expect(() => loadCredentials(undefined, config)).toThrow(AuthError);
    });
  });

  describe("error cases", () => {
    test("throws on missing profile name", () => {
      const config = makeConfig();
      expect(() => loadCredentials("nonexistent", config)).toThrow(AuthError);
      expect(() => loadCredentials("nonexistent", config)).toThrow(/not found/);
    });

    test("throws on CF_PROFILE pointing to missing profile", () => {
      process.env["CF_PROFILE"] = "ghost";
      const config = makeConfig();
      expect(() => loadCredentials(undefined, config)).toThrow(AuthError);
    });

    test("throws on CF_API_KEY without CF_API_EMAIL", () => {
      process.env["CF_API_KEY"] = "orphan-key";
      const config = makeConfig();
      expect(() => loadCredentials(undefined, config)).toThrow(AuthError);
      expect(() => loadCredentials(undefined, config)).toThrow(/CF_API_EMAIL/);
    });

    test("throws on token profile with missing token", () => {
      const config = makeConfig({
        profiles: {
          broken: {
            auth_method: "token",
            // no token!
          },
        },
      });
      expect(() => loadCredentials("broken", config)).toThrow(AuthError);
    });

    test("throws on key profile with missing api_key", () => {
      const config = makeConfig({
        profiles: {
          broken: {
            auth_method: "key",
            email: "test@example.com",
            // no api_key!
          },
        },
      });
      expect(() => loadCredentials("broken", config)).toThrow(AuthError);
    });

    test("throws on key profile with missing email", () => {
      const config = makeConfig({
        profiles: {
          broken: {
            auth_method: "key",
            api_key: "some-key",
            // no email!
          },
        },
      });
      expect(() => loadCredentials("broken", config)).toThrow(AuthError);
    });
  });

  describe("credential shape", () => {
    test("token credentials have correct shape", () => {
      process.env["CF_API_TOKEN"] = "my-token";
      const creds = loadCredentials(undefined, makeConfig());
      expect(creds).toEqual({ method: "token", token: "my-token" });
    });

    test("key credentials have correct shape", () => {
      process.env["CF_API_KEY"] = "my-key";
      process.env["CF_API_EMAIL"] = "me@example.com";
      const creds = loadCredentials(undefined, makeConfig());
      expect(creds).toEqual({
        method: "key",
        apiKey: "my-key",
        email: "me@example.com",
      });
    });
  });
});
