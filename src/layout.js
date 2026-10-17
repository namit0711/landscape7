// Pure layout rules: row grouping, flex sizing, row-height sync and scale-to-fit.
import { MAX_DEPTH, DEFAULT_ROW_SYNC } from './defaults.js';
import { isNum, px, rowOf } from './utils.js';

export const JUSTIFY = {
  start: 'flex-start', left: 'flex-start', center: 'center', end: 'flex-end', right: 'flex-end',
  'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly',
  stretch: 'flex-start' // stretch is implemented by giving children flex-grow (see flexOf)
};

export const V_ALIGN = { top: 'flex-start', middle: 'center', center: 'center', bottom: 'flex-end' };

/** Group nodes by row index (ascending); inside a row sort by `col`, then array order. */
export function groupRows(nodes) {
  const rows = new Map();
  nodes.forEach((node, index) => {
    const row = rowOf(node);
    if (!rows.has(row)) rows.set(row, []);
    rows.get(row).push({ node, index });
  });
  const colOf = (entry) => (isNum(entry.node.col) ? entry.node.col : Infinity);
  return [...rows.keys()].sort((a, b) => a - b).map((row) => ({
    row,
    nodes: rows.get(row)
      .sort((a, b) => colOf(a) - colOf(b) || a.index - b.index)
      .map((entry) => entry.node)
  }));
}

/**
 * CSS `flex` value for a node.
 * width: number = fixed px, string ("30%", "120px") = shrinkable basis, omitted = content width.
 * grow: flex-grow. A parent with justify "stretch" gives content-width children grow 1.
 * Content-width nodes never shrink, so their labels don't wrap unexpectedly.
 */
export function flexOf(node, parentJustify) {
  const { width } = node;
  const auto = width === undefined || width === 'auto';
  let { grow } = node;
  if (!isNum(grow) && auto && parentJustify === 'stretch') grow = 1;

  if (isNum(grow)) return `${grow} 1 ${auto ? 'auto' : px(width)}`;
  if (isNum(width)) return `0 0 ${width}px`;
  if (!auto) return `0 1 ${width}`;
  return '0 0 auto';
}

/** Spacers without an explicit size take the remaining space. */
export function spacerFlexOf(node) {
  const flex = flexOf(node, null);
  return flex === '0 0 auto' ? '1 1 0px' : flex;
}

/**
 * Give every node of the same layer + row index (within its sync scope) the same height.
 * Runs bottom-up (layer 3 first) so containers are measured with their synced content.
 * Each item: { el, layer, row, parentKey, sectionKey, sync }.
 */
export function syncRowHeights(items, defaultSync = DEFAULT_ROW_SYNC) {
  for (const item of items) item.el.style.height = '';

  for (let layer = MAX_DEPTH; layer >= 1; layer--) {
    const groups = new Map();
    for (const item of items) {
      if (item.layer !== layer) continue;
      const key = syncKey(item, item.sync || defaultSync);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
    // Measure everything first, then write, to avoid interleaved reflows.
    const plan = [...groups.values()]
      .filter((group) => group.length > 1)
      .map((group) => [group, Math.max(...group.map((item) => item.el.offsetHeight))]);
    for (const [group, height] of plan) {
      for (const item of group) item.el.style.height = `${height}px`;
    }
  }
}

function syncKey(item, mode) {
  const scope = mode === 'global' ? 'all' : mode === 'parent' ? item.parentKey : item.sectionKey;
  return `${mode}|${scope}|${item.row}`;
}

/** Scale factor that fits a fixed-width canvas into `availableWidth`. */
export function scaleFor(canvas, availableWidth) {
  if (!canvas.scaleToFit || !isNum(canvas.width)) return 1;
  const scale = availableWidth / canvas.width;
  return canvas.allowUpscale ? scale : Math.min(1, scale);
}
