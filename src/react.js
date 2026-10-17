/*!
 * landscape7/react v__VERSION__ | MIT License
 * React binding: <Landscape7 data={...} /> around the vanilla renderer.
 */
// Written without JSX so it runs untranspiled. The core is imported by package
// name, so this entry shares one copy of the renderer with `import 'landscape7'`.
import { createElement, forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { render } from 'landscape7';

// useLayoutEffect avoids a flash of the empty container; it warns during SSR, where effects don't run anyway.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Renders a landscape into a <div>. Extra props (className, style, aria-*, ...) go to that div.
 * The ref receives the LandscapeInstance (or null before mount / after unmount).
 */
export const Landscape7 = forwardRef(function Landscape7({ data, onNodeClick, children: _ignored, ...divProps }, ref) {
  // The renderer owns the div's contents, so React must not render children into it.
  const divRef = useRef(null);
  const instRef = useRef(null);
  const clickRef = useRef(onNodeClick);
  clickRef.current = onNodeClick;

  // The core only adds click handlers when onNodeClick is set, so rebuild when it appears or goes away.
  // Swapping one callback for another just updates clickRef.
  const clickable = typeof onNodeClick === 'function';

  useIsoLayoutEffect(() => {
    const options = clickable ? { onNodeClick: (...args) => clickRef.current?.(...args) } : {};
    const inst = render(divRef.current, data, options);
    instRef.current = inst;
    return () => {
      inst.destroy();
      instRef.current = null;
    };
  }, [clickable]);

  useIsoLayoutEffect(() => {
    const inst = instRef.current;
    if (inst && inst.data !== data) inst.update(data);
  }, [data]);

  useImperativeHandle(ref, () => instRef.current, [clickable]);

  return createElement('div', { ...divProps, ref: divRef });
});

Landscape7.displayName = 'Landscape7';

export default Landscape7;
