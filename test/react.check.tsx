// Compile-only check of the landscape7/react declarations (`npm run typecheck`).
import { useRef } from 'react';
import { Landscape7, type LandscapeInstance, type LandscapeData } from 'landscape7/react';

const data: LandscapeData = { nodes: [{ id: 'a', title: 'A' }] };

export function App() {
  const ref = useRef<LandscapeInstance>(null);
  return (
    <>
      <Landscape7
        ref={ref}
        data={data}
        className="map"
        style={{ maxWidth: 1200 }}
        aria-label="Capability map"
        onNodeClick={(node, event, el) => console.log(node.title, event.clientX, el.tagName, ref.current?.scale)}
      />
      {/* @ts-expect-error data is required */}
      <Landscape7 />
      {/* @ts-expect-error the renderer owns the contents */}
      <Landscape7 data={data}><span /></Landscape7>
    </>
  );
}
