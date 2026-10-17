// Small, dependency-free helpers shared by the other modules.

export const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);

/** Numbers become px; strings pass through unchanged. */
export const px = (v) => (typeof v === 'number' ? `${v}px` : v);

/** First argument that is a number, otherwise `fallback`. */
export const numOr = (...values) => {
  const fallback = values.pop();
  const found = values.find(isNum);
  return found === undefined ? fallback : found;
};

/** Like Object.assign, but skips `undefined` values so they don't erase earlier levels. */
export function assignDefined(target, ...sources) {
  for (const src of sources) {
    if (!src) continue;
    for (const key of Object.keys(src)) {
      if (src[key] !== undefined) target[key] = src[key];
    }
  }
  return target;
}

/** Row index of a node (default 0). */
export const rowOf = (node) => (isNum(node.row) ? node.row : 0);

/** Only allow http(s), mailto, tel and relative links from data (blocks javascript: etc.). */
export function safeUrl(url) {
  const value = String(url).trim();
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value);
  if (!scheme) return value;
  return /^(https?|mailto|tel)$/i.test(scheme[1]) ? value : null;
}

export const warn = (message) => console.warn(`Landscape7: ${message}`);
