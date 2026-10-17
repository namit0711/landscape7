// Type definitions for landscape7

export type LayerIndex = 1 | 2 | 3;
export type Length = number | string;
export type Justify =
  | 'start' | 'left' | 'center' | 'end' | 'right'
  | 'space-between' | 'space-around' | 'space-evenly' | 'stretch';
export type RowSync = 'parent' | 'section' | 'global';

/** Style properties usable on a layer, a named preset or a single node. */
export interface LandscapeStyle {
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  borderColor?: string;
  borderWidth?: Length;
  borderRadius?: Length;
  background?: string;
  fontFamily?: string | null;
  fontSize?: Length;
  fontColor?: string;
  fontWeight?: number | string;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  lineHeight?: number | string;
  /** Horizontal text position. */
  textAlign?: 'left' | 'center' | 'right';
  /** Leaf: vertical text position. Container: title above (`top`) or below (`bottom`) children. */
  verticalAlign?: 'top' | 'middle' | 'bottom';
  /** Minimum height in px; rows grow to fit content. */
  height?: number | 'auto';
  /** Minimum height per row index, e.g. `{ "2": 60 }`. */
  rowHeights?: Record<string, number> | null;
  padding?: Length;
  gap?: number;
  rowGap?: number | null;
  columnGap?: number | null;
  headerGap?: number;
  justify?: Justify;
  rowJustify?: Record<string, Justify>;
  wrap?: boolean;
  textFlow?: 'stack' | 'inline';
  titleMinWidth?: Length | null;
  subtitleFontSize?: Length | null;
  subtitleFontColor?: string | null;
  subtitleFontWeight?: number | string | null;
  subtitleFontStyle?: 'normal' | 'italic' | 'oblique' | null;
  /** Overrides `LandscapeData.rowSync` for nodes using this style. */
  rowSync?: RowSync | null;
  /** Hover effect. Merged across levels: data.hover -> layer -> presets -> node.style. */
  hover?: LandscapeHover | null;
}

/** Visual change applied while the pointer is over a node. */
export interface HoverEffect {
  /** `false` turns hover off at this level (same as passing `false`). */
  enabled?: boolean;
  background?: string;
  fontColor?: string;
  subtitleFontColor?: string;
  borderColor?: string;
  /** CSS brightness() factor; 1 = none. Default 1.12. */
  brightness?: number;
  /** Extra CSS filter functions, e.g. "saturate(1.2)". */
  filter?: string;
  /** CSS box-shadow, or "none". Default "0 2px 8px rgba(0, 0, 0, 0.25)". */
  shadow?: string;
  /** Scale factor, e.g. 1.03. */
  scale?: number;
  /** Vertical shift in px, e.g. -2. */
  translateY?: number;
  cursor?: string;
  /** Transition duration in ms (or a CSS time string). Default 120. */
  transition?: number | string;
}

export type HoverSetting = boolean | HoverEffect;

/**
 * `true` / `false` applies to both node kinds; otherwise configure each kind.
 * Defaults: `leaf: true` (nodes without children), `container: false`.
 */
export type LandscapeHover = boolean | { leaf?: HoverSetting | null; container?: HoverSetting | null };

export interface LandscapeNode {
  id?: string;
  /** `type: "spacer"` renders an empty gap sized by `width` / `grow`. */
  type?: 'node' | 'spacer';
  title?: string;
  subtitle?: string;
  /** Row index (default 0). Same layer + same row = same line and same height. */
  row?: number;
  /** Order inside the row (defaults to array order). */
  col?: number;
  /** Number = fixed px; string ("62%", "120px") = flex basis; omitted = content width. */
  width?: Length | 'auto';
  /** flex-grow factor. */
  grow?: number;
  height?: number | 'auto';
  /** Name(s) of presets from `LandscapeData.styles`, applied left to right. */
  preset?: string | string[];
  style?: LandscapeStyle;
  /** Nested nodes; ignored below layer 3. */
  children?: LandscapeNode[];
  tooltip?: string;
  /** http(s), mailto, tel or relative URLs only. */
  url?: string;
  target?: string;
  className?: string;
  [extra: string]: unknown;
}

export interface LandscapeCanvas {
  /** Fixed canvas width in px (or any CSS length). Omit for 100% of the container. */
  width?: Length;
  /** Scale a fixed-width canvas down to fit its container. */
  scaleToFit?: boolean;
  allowUpscale?: boolean;
  padding?: Length;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  background?: string;
  fontFamily?: string;
  justify?: Justify;
  wrap?: boolean;
}

/** Keys may be written as numbers or strings ("1"). */
export interface LandscapeLayers {
  1?: LandscapeStyle;
  2?: LandscapeStyle;
  3?: LandscapeStyle;
}

export interface LandscapeData {
  $schema?: string;
  canvas?: LandscapeCanvas;
  /** Scope of row-height synchronisation. Default `section`. */
  rowSync?: RowSync;
  /** Hover defaults for the whole landscape (lowest priority). */
  hover?: LandscapeHover;
  /** Per-layer styles, keyed "1" | "2" | "3", or an array `[layer1, layer2, layer3]`. */
  layers?: LandscapeLayers | [LandscapeStyle?, LandscapeStyle?, LandscapeStyle?];
  styles?: Record<string, LandscapeStyle>;
  nodes?: LandscapeNode[];
}

export interface RenderOptions {
  onNodeClick?: (node: LandscapeNode, event: MouseEvent, element: HTMLElement) => void;
}

export interface LandscapeInstance {
  readonly container: HTMLElement;
  readonly data: LandscapeData;
  /** Current scale factor applied by `scaleToFit`. */
  readonly scale: number;
  /** Re-render with new data. */
  update(data: LandscapeData): this;
  /** Recalculate synchronised row heights and scale. */
  relayout(): this;
  /** DOM element of the node with the given id. */
  getElement(id: string): HTMLElement | null;
  /** Remove listeners and clear the container. */
  destroy(): void;
}

export declare const version: string;
export declare const MAX_DEPTH: 3;
export declare const defaults: {
  style: Required<LandscapeStyle>;
  layers: Record<LayerIndex, LandscapeStyle>;
  hover: { leaf: boolean; container: boolean };
  hoverEffect: HoverEffect;
};
export declare function render(
  container: HTMLElement | string,
  data: LandscapeData,
  options?: RenderOptions
): LandscapeInstance;

declare const Landscape7: {
  version: typeof version;
  MAX_DEPTH: typeof MAX_DEPTH;
  defaults: typeof defaults;
  render: typeof render;
};
export default Landscape7;
