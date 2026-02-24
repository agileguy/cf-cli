import { describe, test, expect } from "bun:test";
import {
  validateId,
  validateDomain,
  validateRecordType,
  validateTTL,
  validateIP,
  validatePriority,
  validateOutputFormat,
  parseKeyValue,
  requireArg,
} from "../src/utils/validators.js";
import { UsageError } from "../src/utils/errors.js";

describe("validators", () => {
  describe("validateId", () => {
    test("accepts valid 32-char hex ID", () => {
      expect(validateId("a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4", "zone")).toBe(
        "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
      );
    });

    test("normalizes to lowercase", () => {
      expect(validateId("A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4", "zone")).toBe(
        "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
      );
    });

    test("trims whitespace", () => {
      expect(validateId("  a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4  ", "zone")).toBe(
        "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
      );
    });

    test("rejects short IDs", () => {
      expect(() => validateId("abc123", "zone")).toThrow(UsageError);
    });

    test("rejects non-hex characters", () => {
      expect(() =>
        validateId("g1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4", "zone"),
      ).toThrow(UsageError);
    });

    test("rejects empty string", () => {
      expect(() => validateId("", "zone")).toThrow(UsageError);
    });
  });

  describe("validateDomain", () => {
    test("accepts valid domain", () => {
      expect(validateDomain("example.com")).toBe("example.com");
    });

    test("accepts subdomain", () => {
      expect(validateDomain("sub.example.com")).toBe("sub.example.com");
    });

    test("normalizes to lowercase", () => {
      expect(validateDomain("Example.COM")).toBe("example.com");
    });

    test("rejects single label", () => {
      expect(() => validateDomain("localhost")).toThrow(UsageError);
    });

    test("rejects empty string", () => {
      expect(() => validateDomain("")).toThrow(UsageError);
    });
  });

  describe("validateRecordType", () => {
    test("accepts valid record types", () => {
      expect(validateRecordType("A")).toBe("A");
      expect(validateRecordType("AAAA")).toBe("AAAA");
      expect(validateRecordType("CNAME")).toBe("CNAME");
      expect(validateRecordType("MX")).toBe("MX");
      expect(validateRecordType("TXT")).toBe("TXT");
    });

    test("normalizes to uppercase", () => {
      expect(validateRecordType("cname")).toBe("CNAME");
    });

    test("rejects invalid types", () => {
      expect(() => validateRecordType("INVALID")).toThrow(UsageError);
    });
  });

  describe("validateTTL", () => {
    test("accepts 1 (auto)", () => {
      expect(validateTTL(1)).toBe(1);
      expect(validateTTL("1")).toBe(1);
    });

    test("accepts valid range", () => {
      expect(validateTTL(60)).toBe(60);
      expect(validateTTL(86400)).toBe(86400);
      expect(validateTTL(300)).toBe(300);
    });

    test("rejects below minimum", () => {
      expect(() => validateTTL(30)).toThrow(UsageError);
    });

    test("rejects above maximum", () => {
      expect(() => validateTTL(100000)).toThrow(UsageError);
    });

    test("rejects non-numeric string", () => {
      expect(() => validateTTL("abc")).toThrow(UsageError);
    });
  });

  describe("validateIP", () => {
    test("accepts valid IPv4", () => {
      expect(validateIP("1.2.3.4")).toBe("1.2.3.4");
      expect(validateIP("192.168.1.1")).toBe("192.168.1.1");
    });

    test("accepts valid IPv6", () => {
      expect(validateIP("::1")).toBe("::1");
      expect(validateIP("2001:db8::1")).toBe("2001:db8::1");
    });

    test("rejects invalid IP", () => {
      expect(() => validateIP("not-an-ip")).toThrow(UsageError);
    });

    test("rejects out-of-range octets", () => {
      expect(() => validateIP("256.1.1.1")).toThrow(UsageError);
    });
  });

  describe("validatePriority", () => {
    test("accepts valid priorities", () => {
      expect(validatePriority(0)).toBe(0);
      expect(validatePriority(10)).toBe(10);
      expect(validatePriority(65535)).toBe(65535);
    });

    test("accepts string numbers", () => {
      expect(validatePriority("10")).toBe(10);
    });

    test("rejects negative", () => {
      expect(() => validatePriority(-1)).toThrow(UsageError);
    });

    test("rejects too high", () => {
      expect(() => validatePriority(70000)).toThrow(UsageError);
    });
  });

  describe("validateOutputFormat", () => {
    test("accepts valid formats", () => {
      expect(validateOutputFormat("table")).toBe("table");
      expect(validateOutputFormat("json")).toBe("json");
      expect(validateOutputFormat("csv")).toBe("csv");
      expect(validateOutputFormat("yaml")).toBe("yaml");
    });

    test("normalizes case", () => {
      expect(validateOutputFormat("JSON")).toBe("json");
    });

    test("rejects invalid formats", () => {
      expect(() => validateOutputFormat("xml")).toThrow(UsageError);
    });
  });

  describe("parseKeyValue", () => {
    test("parses simple key=value", () => {
      expect(parseKeyValue("name=test")).toEqual(["name", "test"]);
    });

    test("handles value with equals sign", () => {
      expect(parseKeyValue("content=a=b=c")).toEqual(["content", "a=b=c"]);
    });

    test("rejects missing equals", () => {
      expect(() => parseKeyValue("noequals")).toThrow(UsageError);
    });
  });

  describe("requireArg", () => {
    test("returns arg at index", () => {
      expect(requireArg(["foo", "bar"], 0, "first")).toBe("foo");
      expect(requireArg(["foo", "bar"], 1, "second")).toBe("bar");
    });

    test("throws for missing arg", () => {
      expect(() => requireArg([], 0, "required")).toThrow(UsageError);
    });

    test("treats flag-like args as missing", () => {
      expect(() => requireArg(["--flag"], 0, "positional")).toThrow(UsageError);
    });
  });
});
