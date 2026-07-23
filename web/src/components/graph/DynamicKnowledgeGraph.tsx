'use client';

import type {KnowledgeGraph2DProps} from '@recoil-river/graph';
import dynamic from 'next/dynamic';

const ClientKnowledgeGraph = dynamic<KnowledgeGraph2DProps>(
  () =>
    import('@recoil-river/graph').then((module) => module.KnowledgeGraph2D),
  {
    ssr: false,
    loading: () => (
      <div className="graph-canvas-loading" aria-busy="true">
        Starting the graph engine…
      </div>
    ),
  },
);

export function DynamicKnowledgeGraph(props: KnowledgeGraph2DProps) {
  return <ClientKnowledgeGraph {...props} />;
}
