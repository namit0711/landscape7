// Built-in configuration values. Everything a user can override lives here.

/** Maximum nesting depth: layer 1 = section, 2 = group, 3 = item. */
export const MAX_DEPTH = 3;

/** Lowest-priority style for every node, before layer / preset / node overrides. */
export const BASE_STYLE = Object.freeze({
  borderStyle: 'solid',
  borderColor: '#9aa3ad',
  borderWidth: 1,
  borderRadius: 0,
  background: 'transparent',
  fontFamily: null,
  fontSize: 14,
  fontColor: '#222',
  fontWeight: 400,
  fontStyle: 'normal',
  lineHeight: 1.25,
  textAlign: 'center',      // left | center | right
  verticalAlign: 'middle',  // top | middle | bottom
  height: 'auto',           // minimum height in px (rows grow to fit content)
  rowHeights: null,         // { "<row>": px } minimum height per row index
  padding: '6px 10px',
  gap: 8,                   // spacing between children (rows and columns)
  rowGap: null,
  columnGap: null,
  headerGap: 8,             // spacing between a container title and its children
  justify: 'start',         // start | center | end | space-between | space-around | stretch
  rowJustify: null,         // { "<row>": justify }
  wrap: false,
  textFlow: 'stack',        // stack (subtitle below title) | inline (same line)
  titleMinWidth: null,
  subtitleFontSize: null,
  subtitleFontColor: null,
  subtitleFontWeight: 400,
  subtitleFontStyle: null,
  rowSync: null,            // parent | section | global (overrides data.rowSync)
  hover: null               // { leaf, container } - see HOVER_DEFAULTS
});

/** Built-in look per layer, applied on top of BASE_STYLE. */
export const LAYER_DEFAULTS = Object.freeze({
  1: { background: '#fff', borderColor: '#3a3a3a', fontWeight: 700, verticalAlign: 'top', padding: '8px 20px 16px', headerGap: 10 },
  2: { background: '#fff', borderStyle: 'dashed', borderColor: '#6f9bd6', fontColor: '#1f6fc2', fontWeight: 700, verticalAlign: 'top', padding: '6px 20px 16px' },
  3: { background: '#0b4ea2', borderStyle: 'none', fontColor: '#fff', height: 44 }
});

/** Which node kinds react to hover when nothing is configured. */
export const HOVER_DEFAULTS = Object.freeze({ leaf: true, container: false });

/** Effect used when hover is enabled without (or with a partial) effect object. */
export const DEFAULT_HOVER_EFFECT = Object.freeze({
  brightness: 1.12,
  shadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
  transition: 120
});

/** Canvas (root container) defaults. */
export const CANVAS_DEFAULTS = Object.freeze({
  gap: 16,
  padding: 0,
  background: 'transparent',
  fontFamily: 'Arial, Helvetica, sans-serif',
  justify: 'stretch'
});

/** Row sync scope used when neither data.rowSync nor a style sets one. */
export const DEFAULT_ROW_SYNC = 'section';
