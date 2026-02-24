const ESC = "\x1b[";

function shouldDisableColor(): boolean {
  // NO_COLOR spec: https://no-color.org/
  if (process.env["NO_COLOR"] !== undefined) return true;
  if (process.env["TERM"] === "dumb") return true;
  if (!process.stdout.isTTY) return true;
  return false;
}

let _noColor: boolean | null = null;

/** Set the no-color override from --no-color flag */
export function setNoColor(value: boolean): void {
  _noColor = value;
}

function isColorDisabled(): boolean {
  if (_noColor !== null) return _noColor;
  return shouldDisableColor();
}

function wrap(code: string, resetCode: string): (text: string) => string {
  return (text: string): string => {
    if (isColorDisabled()) return text;
    return `${ESC}${code}m${text}${ESC}${resetCode}m`;
  };
}

export const green = wrap("32", "39");
export const red = wrap("31", "39");
export const yellow = wrap("33", "39");
export const cyan = wrap("36", "39");
export const dim = wrap("2", "22");
export const bold = wrap("1", "22");
export const reset = (text: string): string => `${ESC}0m${text}`;

/** Strip all ANSI escape sequences from a string */
export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}
