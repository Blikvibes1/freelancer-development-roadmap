/**
 * Minimal CSV serializer — escapes quotes/commas/newlines (RFC 4180 style).
 */

function escapeCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * @param {string[]} headers - column keys / header labels
 * @param {object[]} rows - array of objects
 * @param {string[]} [keys] - object keys in column order (defaults to headers)
 */
function toCsv(headers, rows, keys) {
  const cols = keys || headers;
  const lines = [];
  lines.push(headers.map(escapeCell).join(","));

  for (const row of rows) {
    const line = cols.map((key) => escapeCell(row[key])).join(",");
    lines.push(line);
  }

  // BOM helps Excel open UTF-8 correctly
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

function filenameWithDate(prefix) {
  const d = new Date();
  const stamp = d.toISOString().slice(0, 10);
  return `${prefix}-${stamp}.csv`;
}

module.exports = { toCsv, escapeCell, filenameWithDate };
