// Hover effects: resolve the configured effect for a node and expose it as CSS variables.
import { HOVER_DEFAULTS, DEFAULT_HOVER_EFFECT } from './defaults.js';
import { assignDefined, isNum } from './utils.js';

/**
 * Merge hover settings for one node kind ("leaf" | "container").
 * Each level is `true`/`false` (both kinds) or `{ leaf, container }` where each value is
 * `true`, `false` or an effect object (`enabled: false` inside an object disables it).
 * Returns the effect object, or null when hover is off.
 */
export function resolveHover(levels, kind) {
  let enabled = HOVER_DEFAULTS[kind];
  const effect = { ...DEFAULT_HOVER_EFFECT };
  for (const level of levels) {
    const setting = typeof level === 'boolean' ? level : level && level[kind];
    if (setting === undefined || setting === null) continue;
    if (typeof setting === 'boolean') {
      enabled = setting;
    } else {
      enabled = setting.enabled !== false;
      assignDefined(effect, setting);
    }
  }
  return enabled ? effect : null;
}

const filterOf = (h) => [
  isNum(h.brightness) && h.brightness !== 1 ? `brightness(${h.brightness})` : '',
  h.filter || ''
].filter(Boolean).join(' ');

const transformOf = (h) => [
  isNum(h.translateY) && h.translateY !== 0 ? `translateY(${h.translateY}px)` : '',
  isNum(h.scale) && h.scale !== 1 ? `scale(${h.scale})` : ''
].filter(Boolean).join(' ');

/**
 * Write the effect as --lsc-h-* variables and add the classes whose :hover rules use them
 * (see css.js). Colour overrides need their own class because they must beat inline styles.
 */
export function applyHover(el, effect) {
  if (!effect) return;
  const vars = [
    ['filter', filterOf(effect)],
    ['shadow', effect.shadow === 'none' ? null : effect.shadow],
    ['transform', transformOf(effect)],
    ['dur', isNum(effect.transition) ? `${effect.transition}ms` : effect.transition],
    ['bg', effect.background, 'lsc-h-bg'],
    ['color', effect.fontColor, 'lsc-h-color'],
    ['border', effect.borderColor, 'lsc-h-border'],
    ['subcolor', effect.subtitleFontColor, 'lsc-h-subcolor'],
    ['cursor', effect.cursor, 'lsc-h-cursor']
  ];
  el.classList.add('lsc-hover');
  for (const [name, value, className] of vars) {
    if (value === undefined || value === null || value === '' || value === false) continue;
    el.style.setProperty(`--lsc-h-${name}`, String(value));
    if (className) el.classList.add(className);
  }
}
