// Unit tests for the DOM-free modules (layout rules, style cascade, hover merging, utils).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupRows, flexOf, spacerFlexOf, scaleFor, syncRowHeights } from '../src/layout.js';
import { StyleResolver, normalizeLayers } from '../src/style.js';
import { resolveHover } from '../src/hover.js';
import { safeUrl, numOr, assignDefined, px } from '../src/utils.js';

test('groupRows: rows ascending, col then array order, default row 0', () => {
  const rows = groupRows([{ id: 'c', row: 2 }, { id: 'b', row: 1, col: 2 }, { id: 'a', row: 1, col: 1 }, { id: 'z' }, { id: 'd', row: 1 }]);
  assert.deepEqual(rows.map((r) => [r.row, r.nodes.map((n) => n.id)]), [[0, ['z']], [1, ['a', 'b', 'd']], [2, ['c']]]);
});

test('flexOf / spacerFlexOf', () => {
  assert.equal(flexOf({ width: 120 }), '0 0 120px');
  assert.equal(flexOf({ width: '30%' }), '0 1 30%');
  assert.equal(flexOf({ grow: 2 }), '2 1 auto');
  assert.equal(flexOf({ grow: 1, width: '40%' }), '1 1 40%');
  assert.equal(flexOf({}), '0 0 auto');
  assert.equal(flexOf({}, 'stretch'), '1 1 auto');
  assert.equal(flexOf({ width: 100 }, 'stretch'), '0 0 100px', 'explicit width is not stretched');
  assert.equal(spacerFlexOf({}), '1 1 0px');
  assert.equal(spacerFlexOf({ width: 40 }), '0 0 40px');
});

test('scaleFor', () => {
  assert.equal(scaleFor({ width: 1000 }, 500), 1, 'no scaleToFit');
  assert.equal(scaleFor({ width: 1000, scaleToFit: true }, 500), 0.5);
  assert.equal(scaleFor({ width: 1000, scaleToFit: true }, 2000), 1, 'no upscale by default');
  assert.equal(scaleFor({ width: 1000, scaleToFit: true, allowUpscale: true }, 2000), 2);
  assert.equal(scaleFor({ width: '100%', scaleToFit: true }, 500), 1, 'fluid canvas never scales');
});

test('syncRowHeights: groups by layer, row and scope; singletons untouched', () => {
  const fake = (h) => ({ style: { height: '' }, get offsetHeight() { return parseFloat(this.style.height) || h; } });
  const item = (h, extra) => ({ el: fake(h), layer: 3, row: 1, parentKey: 'p1', sectionKey: 's1', ...extra });
  const a = item(30), b = item(50, { parentKey: 'p2' }), c = item(70, { sectionKey: 's2' }), d = item(90, { row: 2 });
  syncRowHeights([a, b, c, d]);
  assert.deepEqual([a, b, c, d].map((i) => i.el.style.height), ['50px', '50px', '', '']);
  syncRowHeights([a, b, c, d], 'global');
  assert.deepEqual([a, b, c].map((i) => i.el.style.height), ['70px', '70px', '70px']);
});

test('StyleResolver cascade and hover levels', () => {
  const resolver = new StyleResolver({
    hover: { leaf: { background: 'r' } },
    layers: [{ fontSize: 10, hover: false }],
    styles: { big: { fontSize: 20, rowHeights: { 3: 99 } } }
  });
  const s = resolver.resolve({ row: 3, preset: 'big', style: { fontColor: 'x' } }, 1);
  assert.equal(s.fontSize, 20);
  assert.equal(s.fontColor, 'x');
  assert.equal(s.height, 99);
  assert.equal(s.borderColor, '#3a3a3a', 'layer-1 built-in default');
  assert.deepEqual(s.hover, [{ leaf: { background: 'r' } }, false, undefined, undefined]);
  assert.deepEqual(normalizeLayers({ 2: { a: 1 } }), { 2: { a: 1 } });
});

test('resolveHover', () => {
  assert.ok(resolveHover([], 'leaf'));
  assert.equal(resolveHover([], 'container'), null);
  assert.equal(resolveHover([true], 'container').brightness, 1.12);
  assert.equal(resolveHover([{ leaf: { scale: 2 } }, { leaf: { brightness: 1 } }], 'leaf').scale, 2, 'effects merge');
  assert.equal(resolveHover([false, { leaf: true }], 'leaf').brightness, 1.12, 're-enabled later');
  assert.equal(resolveHover([{ leaf: { enabled: false } }], 'leaf'), null);
});

test('utils', () => {
  assert.equal(safeUrl(' https://x.io '), 'https://x.io');
  assert.equal(safeUrl('./a'), './a');
  assert.equal(safeUrl('JavaScript:alert(1)'), null);
  assert.equal(safeUrl('data:text/html,x'), null);
  assert.equal(numOr(undefined, null, 5, 9), 5);
  assert.equal(numOr(undefined, 9), 9);
  assert.deepEqual(assignDefined({ a: 1 }, { a: undefined, b: 2 }, null), { a: 1, b: 2 });
  assert.equal(px(3), '3px');
  assert.equal(px('1em'), '1em');
});
