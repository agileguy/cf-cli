import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  readConfig,
  writeConfig,
  getProfile,
  setProfile,
  deleteProfile,
} from "../src/config.js";
import type { Config, Profile } from "../src/types/index.js";

function makeConfig(overrides?: Partial<Config>): Config {
  return {
    version: 1,
    default_profile: "default",
    profiles: {},
    defaults: { output: "table", no_color: false, per_page: 20 },
    ...overrides,
  };
}

describe("config", () => {
  describe("readConfig", () => {
    test("returns default config when file does not exist", () => {
      const config = readConfig();
      expect(config.version).toBe(1);
      expect(config.default_profile).toBe("default");
      expect(config.profiles).toBeDefined();
      expect(config.defaults.output).toBe("table");
    });
  });

  describe("getProfile", () => {
    test("returns profile by name", () => {
      const config = makeConfig({
        profiles: {
          staging: { auth_method: "token", token: "stg-tok" },
          production: { auth_method: "key", api_key: "prd-key", email: "p@e.com" },
        },
      });

      const staging = getProfile(config, "staging");
      expect(staging).not.toBeNull();
      expect(staging!.auth_method).toBe("token");
      expect(staging!.token).toBe("stg-tok");

      const production = getProfile(config, "production");
      expect(production).not.toBeNull();
      expect(production!.auth_method).toBe("key");
    });

    test("returns default profile when no name given", () => {
      const config = makeConfig({
        default_profile: "main",
        profiles: {
          main: { auth_method: "token", token: "main-tok" },
        },
      });

      const profile = getProfile(config);
      expect(profile).not.toBeNull();
      expect(profile!.token).toBe("main-tok");
    });

    test("returns null for nonexistent profile", () => {
      const config = makeConfig();
      expect(getProfile(config, "ghost")).toBeNull();
    });
  });

  describe("setProfile", () => {
    test("adds a new profile", () => {
      const config = makeConfig();
      const newProfile: Profile = { auth_method: "token", token: "new-tok" };
      const updated = setProfile(config, "new", newProfile);

      expect(updated.profiles["new"]).toBeDefined();
      expect(updated.profiles["new"]!.token).toBe("new-tok");
    });

    test("updates an existing profile", () => {
      const config = makeConfig({
        profiles: {
          existing: { auth_method: "token", token: "old-tok" },
        },
      });
      const updatedProfile: Profile = { auth_method: "token", token: "updated-tok" };
      const updated = setProfile(config, "existing", updatedProfile);

      expect(updated.profiles["existing"]!.token).toBe("updated-tok");
    });

    test("does not mutate original config", () => {
      const config = makeConfig();
      const newProfile: Profile = { auth_method: "token", token: "new-tok" };
      const updated = setProfile(config, "new", newProfile);

      expect(config.profiles["new"]).toBeUndefined();
      expect(updated.profiles["new"]).toBeDefined();
    });
  });

  describe("deleteProfile", () => {
    test("removes a profile", () => {
      const config = makeConfig({
        profiles: {
          a: { auth_method: "token", token: "tok-a" },
          b: { auth_method: "token", token: "tok-b" },
        },
      });
      const updated = deleteProfile(config, "a");

      expect(updated.profiles["a"]).toBeUndefined();
      expect(updated.profiles["b"]).toBeDefined();
    });

    test("does not mutate original config", () => {
      const config = makeConfig({
        profiles: {
          target: { auth_method: "token", token: "tok" },
        },
      });
      const updated = deleteProfile(config, "target");

      expect(config.profiles["target"]).toBeDefined();
      expect(updated.profiles["target"]).toBeUndefined();
    });

    test("handles deleting nonexistent profile gracefully", () => {
      const config = makeConfig({
        profiles: {
          keeper: { auth_method: "token", token: "tok" },
        },
      });
      const updated = deleteProfile(config, "ghost");

      expect(updated.profiles["keeper"]).toBeDefined();
    });
  });

  describe("writeConfig and readConfig round-trip", () => {
    // Note: writeConfig writes to ~/.cf/config.json
    // We test the serialization logic indirectly via setProfile/deleteProfile
    // A full integration test would write/read from the actual path

    test("config is serializable to JSON", () => {
      const config = makeConfig({
        profiles: {
          test: { auth_method: "token", token: "round-trip" },
        },
      });

      const serialized = JSON.stringify(config);
      const deserialized = JSON.parse(serialized) as Config;

      expect(deserialized.profiles["test"]!.token).toBe("round-trip");
      expect(deserialized.version).toBe(1);
    });

    test("preserves all config fields through serialization", () => {
      const config = makeConfig({
        default_profile: "prod",
        profiles: {
          prod: {
            auth_method: "key",
            api_key: "key123",
            email: "admin@example.com",
            account_id: "acc123",
            zone_id: "zone456",
          },
        },
        defaults: {
          output: "json",
          no_color: true,
          per_page: 50,
        },
      });

      const json = JSON.stringify(config, null, 2);
      const restored = JSON.parse(json) as Config;

      expect(restored.default_profile).toBe("prod");
      expect(restored.profiles["prod"]!.api_key).toBe("key123");
      expect(restored.profiles["prod"]!.account_id).toBe("acc123");
      expect(restored.defaults.output).toBe("json");
      expect(restored.defaults.per_page).toBe(50);
    });
  });
});
