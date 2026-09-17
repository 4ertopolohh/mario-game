export function splitGraphemes(str) {
  if (!str) return [];
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    try {
      const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      return Array.from(seg.segment(str), s => s.segment);
    } catch { /* fallthrough */ }
  }
  return Array.from(str);
}

export function truncateNickname(str, maxLen) {
  if (!str) return "";
  const graphemes = splitGraphemes(str);
  if (graphemes.length <= maxLen) return str;
  return graphemes.slice(0, Math.max(0, maxLen - 1)).join("") + "…";
}