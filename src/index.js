/*!
 * landscape7 v__VERSION__ | MIT License
 * Config-driven renderer for capability / solution landscape diagrams.
 */
// Module map:
//   defaults.js  built-in style, layer, hover and canvas defaults
//   style.js     style cascade: defaults -> layers[n] -> presets -> node.style
//   hover.js     hover setting merge + CSS-variable output
//   layout.js    row grouping, flex sizing, row-height sync, scale-to-fit
//   builder.js   data -> DOM
//   renderer.js  instance lifecycle (update, relayout, resize, destroy)
//   css.js       base stylesheet
import { Renderer } from './renderer.js';
import { MAX_DEPTH, BASE_STYLE, LAYER_DEFAULTS, HOVER_DEFAULTS, DEFAULT_HOVER_EFFECT } from './defaults.js';

/* global __VERSION__ -- replaced at build time */
export const version = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '0.0.0-dev';

export { MAX_DEPTH };

export const defaults = Object.freeze({
  style: BASE_STYLE,
  layers: LAYER_DEFAULTS,
  hover: HOVER_DEFAULTS,
  hoverEffect: DEFAULT_HOVER_EFFECT
});

/**
 * Render a landscape into `container` (an element or a CSS selector).
 * Returns an instance with update(), relayout(), getElement() and destroy().
 */
export function render(container, data, options) {
  return new Renderer(container, data, options);
}

export default { version, MAX_DEPTH, defaults, render };
