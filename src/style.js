// Style resolution: built-in defaults -> data.layers[n] -> presets (left to right) -> node.style.
import { BASE_STYLE, LAYER_DEFAULTS } from './defaults.js';
import { assignDefined, rowOf, warn } from './utils.js';

/** Accept `layers` as `{ "1": {...} }` or `[layer1, layer2, layer3]`; return `{ 1: {...} }`. */
export function normalizeLayers(layers) {
  if (Array.isArray(layers)) return Object.fromEntries(layers.map((style, i) => [i + 1, style]));
  return Object.fromEntries(Object.entries(layers || {}).map(([key, style]) => [Number(key), style]));
}

/**
 * Resolves node styles for one landscape definition.
 * The result's `hover` is the list of hover settings from every level, lowest priority
 * first, because hover effects merge across levels instead of being replaced.
 */
export class StyleResolver {
  constructor(data) {
    this.layers = normalizeLayers(data.layers);
    this.presets = data.styles || {};
    this.rootHover = data.hover;
  }

  resolve(node, layer) {
    const layerStyle = this.layers[layer];
    const presets = this._presetsOf(node);
    const levels = [layerStyle, ...presets, node.style];

    const style = assignDefined({}, BASE_STYLE, LAYER_DEFAULTS[layer], ...levels);
    style.hover = [this.rootHover, ...levels.map((level) => level && level.hover)];

    if (node.height !== undefined) style.height = node.height;
    const rowHeight = style.rowHeights && style.rowHeights[rowOf(node)];
    if (rowHeight !== undefined && rowHeight !== null) style.height = rowHeight;
    return style;
  }

  _presetsOf(node) {
    const names = node.preset ? [].concat(node.preset) : [];
    return names.map((name) => {
      const preset = this.presets[name];
      if (!preset) warn(`unknown style preset "${name}"`);
      return preset;
    });
  }
}
