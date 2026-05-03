/**
 * Trim leading/trailing blank lines and re-indent a method body so it
 * fits cleanly under a TypeScript class method opening at depth `prefix`.
 *
 * Strategy:
 *   1. Strip purely-blank leading and trailing lines.
 *   2. Find the minimum indent across non-blank lines.
 *   3. Subtract that indent from every line, then prepend `prefix`.
 *
 * Preserves nested structure (loops, if-blocks) while normalising the
 * outer indent.
 *
 * Lifted as-is from sel2pw v1.0.0 `src/utils/indent.ts`.
 */
export function dedentAndIndent(body: string, prefix: string): string {
  const lines = body.split("\n");

  while (lines.length && lines[0].trim() === "") lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
  if (lines.length === 0) return "";

  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim() === "") continue;
    const m = line.match(/^[\t ]*/);
    const len = m ? m[0].length : 0;
    if (len < minIndent) minIndent = len;
  }
  if (!isFinite(minIndent)) minIndent = 0;

  return lines
    .map((line) => (line.trim() === "" ? "" : prefix + line.slice(minIndent)))
    .join("\n");
}
