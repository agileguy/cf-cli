import type {
  OutputFormatter as IOutputFormatter,
  ColumnDef,
  GlobalFlags,
} from "./types/index.js";
import { green, red, yellow, cyan, dim, bold, stripAnsi } from "./utils/colors.js";

// Box-drawing characters
const BOX = {
  topLeft: "\u250c",
  topRight: "\u2510",
  bottomLeft: "\u2514",
  bottomRight: "\u2518",
  horizontal: "\u2500",
  vertical: "\u2502",
  teeDown: "\u252c",
  teeUp: "\u2534",
  teeRight: "\u251c",
  teeLeft: "\u2524",
  cross: "\u253c",
} as const;

export class OutputFormatterImpl implements IOutputFormatter {
  private flags: GlobalFlags;

  constructor(flags: GlobalFlags) {
    this.flags = flags;
  }

  table(data: unknown[], columns: ColumnDef[]): void {
    if (this.flags.quiet) return;
    if (data.length === 0) {
      this.info("No results found.");
      return;
    }

    // Calculate column widths
    const widths = columns.map((col) => {
      const headerLen = col.header.length;
      let maxDataLen = 0;
      for (const row of data) {
        const value = getNestedValue(row, col.key);
        const formatted = col.transform
          ? col.transform(value)
          : String(value ?? "");
        const stripped = stripAnsi(formatted);
        if (stripped.length > maxDataLen) maxDataLen = stripped.length;
      }
      const natural = Math.max(headerLen, maxDataLen);
      return col.width ? Math.min(col.width, Math.max(headerLen, natural)) : natural;
    });

    // Top border
    const topBorder =
      BOX.topLeft +
      widths.map((w) => BOX.horizontal.repeat(w + 2)).join(BOX.teeDown) +
      BOX.topRight;

    // Header row
    const headerRow =
      BOX.vertical +
      columns
        .map((col, i) => ` ${bold(padRight(col.header, widths[i] ?? 0))} `)
        .join(BOX.vertical) +
      BOX.vertical;

    // Separator
    const separator =
      BOX.teeRight +
      widths.map((w) => BOX.horizontal.repeat(w + 2)).join(BOX.cross) +
      BOX.teeLeft;

    // Data rows
    const dataRows = data.map((row) => {
      return (
        BOX.vertical +
        columns
          .map((col, i) => {
            const value = getNestedValue(row, col.key);
            let formatted = col.transform
              ? col.transform(value)
              : String(value ?? "");
            if (col.color) {
              formatted = col.color(value);
            }
            return ` ${padRightAnsi(formatted, widths[i] ?? 0)} `;
          })
          .join(BOX.vertical) +
        BOX.vertical
      );
    });

    // Bottom border
    const bottomBorder =
      BOX.bottomLeft +
      widths.map((w) => BOX.horizontal.repeat(w + 2)).join(BOX.teeUp) +
      BOX.bottomRight;

    const output = [topBorder, headerRow, separator, ...dataRows, bottomBorder]
      .join("\n");
    process.stdout.write(output + "\n");
  }

  json(data: unknown): void {
    if (this.flags.quiet) return;
    process.stdout.write(JSON.stringify(data, null, 2) + "\n");
  }

  csv(data: unknown[], columns: ColumnDef[]): void {
    if (this.flags.quiet) return;
    // Header
    const header = columns.map((c) => csvEscape(c.header)).join(",");
    process.stdout.write(header + "\n");
    // Data rows
    for (const row of data) {
      const line = columns
        .map((col) => {
          const value = getNestedValue(row, col.key);
          const formatted = col.transform
            ? col.transform(value)
            : String(value ?? "");
          return csvEscape(formatted);
        })
        .join(",");
      process.stdout.write(line + "\n");
    }
  }

  yaml(data: unknown): void {
    if (this.flags.quiet) return;
    process.stdout.write(toYaml(data, 0) + "\n");
  }

  raw(data: unknown): void {
    if (this.flags.quiet) return;
    process.stdout.write(JSON.stringify(data, null, 2) + "\n");
  }

  success(message: string): void {
    if (this.flags.quiet) return;
    process.stdout.write(`${green("\u2713")} ${message}\n`);
  }

  error(message: string): void {
    // Errors always print, even in quiet mode
    process.stderr.write(`${red("\u2717")} ${message}\n`);
  }

  warn(message: string): void {
    if (this.flags.quiet) return;
    process.stderr.write(`${yellow("!")} ${message}\n`);
  }

  info(message: string): void {
    if (this.flags.quiet) return;
    process.stderr.write(`${cyan("\u2139")} ${message}\n`);
  }

  detail(data: Record<string, unknown>): void {
    if (this.flags.quiet) return;
    const maxKeyLen = Math.max(
      ...Object.keys(data).map((k) => k.length),
    );
    for (const [key, value] of Object.entries(data)) {
      const paddedKey = padRight(key, maxKeyLen);
      process.stdout.write(
        `${dim(paddedKey)}  ${formatDetailValue(value)}\n`,
      );
    }
  }
}

/** Get a nested value from an object using dot notation */
function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/** Pad a string to the right (plain text) */
function padRight(str: string, len: number): string {
  if (str.length >= len) return str;
  return str + " ".repeat(len - str.length);
}

/** Pad a string to the right, accounting for ANSI escape codes */
function padRightAnsi(str: string, len: number): string {
  const stripped = stripAnsi(str);
  if (stripped.length >= len) return str;
  return str + " ".repeat(len - stripped.length);
}

/** Escape a value for CSV */
function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Convert a value to simple YAML format */
function toYaml(data: unknown, indent: number): string {
  const prefix = "  ".repeat(indent);

  if (data === null || data === undefined) {
    return `${prefix}null`;
  }

  if (typeof data === "string") {
    if (data.includes("\n") || data.includes(":") || data.includes("#")) {
      return `${prefix}"${data.replace(/"/g, '\\"')}"`;
    }
    return `${prefix}${data}`;
  }

  if (typeof data === "number" || typeof data === "boolean") {
    return `${prefix}${data}`;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return `${prefix}[]`;
    return data
      .map((item) => {
        const itemStr = toYaml(item, 0).trimStart();
        return `${prefix}- ${itemStr}`;
      })
      .join("\n");
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return `${prefix}{}`;
    return entries
      .map(([key, value]) => {
        if (
          value === null ||
          value === undefined ||
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          const valStr = toYaml(value, 0).trimStart();
          return `${prefix}${key}: ${valStr}`;
        }
        // Nested object or array
        const nested = toYaml(value, indent + 1);
        return `${prefix}${key}:\n${nested}`;
      })
      .join("\n");
  }

  return `${prefix}${String(data)}`;
}

/** Format a single detail value for display */
function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined) return dim("(none)");
  if (typeof value === "boolean") return value ? green("true") : red("false");
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}
