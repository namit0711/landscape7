// Type definitions for landscape7/react

import type { ForwardRefExoticComponent, HTMLAttributes, RefAttributes } from 'react';
import type { LandscapeData, LandscapeInstance, RenderOptions } from 'landscape7';

export type {
  LandscapeData, LandscapeNode, LandscapeStyle, LandscapeInstance, RenderOptions
} from 'landscape7';

export interface LandscapeProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Landscape JSON. A new object reference re-renders the diagram. */
  data: LandscapeData;
  /** Called with the innermost clicked node. Swapping callbacks does not re-render. */
  onNodeClick?: RenderOptions['onNodeClick'];
  /** Ignored: the renderer owns the container's contents. */
  children?: never;
}

/** Renders a landscape into a `<div>`. The ref receives the `LandscapeInstance`. */
export declare const Landscape7: ForwardRefExoticComponent<LandscapeProps & RefAttributes<LandscapeInstance>>;
export default Landscape7;
