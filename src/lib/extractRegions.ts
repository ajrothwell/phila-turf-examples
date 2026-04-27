/**
 * Pull named regions out of a source file string and concatenate them with
 * an elision marker between non-contiguous chunks.
 *
 * Mark regions in the source with line comments:
 *   // #region NAME
 *   ...lines to include...
 *   // #endregion NAME
 *
 * Or with HTML-style comments (for Vue templates):
 *   <!-- #region NAME -->
 *   ...lines to include...
 *   <!-- #endregion NAME -->
 *
 * The marker lines themselves are excluded from the output. Indentation is
 * normalized: the minimum leading whitespace common to non-blank lines in
 * each region is stripped, so an extracted method body reads as top-level
 * code.
 */
export function extractRegions(source: string, regions: string[]): string {
  const lines = source.split('\n')
  const parts: string[] = []

  for (const name of regions) {
    const startMarkers = [`// #region ${name}`, `<!-- #region ${name} -->`]
    const endMarkers = [`// #endregion ${name}`, `<!-- #endregion ${name} -->`]

    const startIdx = lines.findIndex((l) => startMarkers.includes(l.trim()))
    const endIdx = lines.findIndex((l) => endMarkers.includes(l.trim()))

    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      throw new Error(`extractRegions: region "${name}" not found in source`)
    }

    const body = lines.slice(startIdx + 1, endIdx)
    const indent = minIndent(body)
    const dedented = body.map((l) => (l.length >= indent ? l.slice(indent) : l))
    parts.push(dedented.join('\n').replace(/^\n+|\n+$/g, ''))
  }

  return parts.join('\n\n// ...\n\n')
}

function minIndent(lines: string[]): number {
  let min = Infinity
  for (const l of lines) {
    if (l.trim() === '') continue
    const m = l.match(/^[ \t]*/)
    const len = m ? m[0].length : 0
    if (len < min) min = len
  }
  return min === Infinity ? 0 : min
}
