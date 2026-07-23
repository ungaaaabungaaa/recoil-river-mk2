'use client';

import {useConvexAuth} from '@convex-dev/auth/react';
import {api} from '@recoil-river/backend/api';
import {
  type KnowledgeGraph,
  type KnowledgeNode,
} from '@recoil-river/graph';
import {useQuery} from 'convex/react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect, useMemo, useRef, useState} from 'react';

import {DynamicKnowledgeGraph} from './DynamicKnowledgeGraph';

const HEADER_HEIGHT = 68;

function useGraphViewport() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({width: 960, height: 640});

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const update = () => {
      const rect = stage.getBoundingClientRect();
      setViewport({
        width: Math.max(320, Math.round(rect.width || window.innerWidth || 960)),
        height: Math.max(
          320,
          Math.round(rect.height || window.innerHeight - HEADER_HEIGHT || 640),
        ),
      });
    };
    update();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  return {stageRef, viewport};
}

export function GraphPage() {
  const router = useRouter();
  const {isAuthenticated, isLoading: isAuthLoading} = useConvexAuth();
  const snapshot = useQuery(
    api.graph.getPopupSnapshot,
    isAuthenticated ? {} : 'skip',
  );
  const {stageRef, viewport} = useGraphViewport();
  const graph = useMemo<KnowledgeGraph>(() => {
    if (!snapshot) {
      return {nodes: [], edges: []};
    }
    return {
      nodes: snapshot.nodes.map((node) => ({
        ...node,
        id: String(node.id),
      })),
      edges: snapshot.edges.map((edge) => ({
        ...edge,
        id: String(edge.id),
        source: String(edge.source),
        target: String(edge.target),
      })),
    };
  }, [snapshot]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login?returnTo=%2Fgraph');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  if (isAuthLoading || (isAuthenticated && snapshot === undefined)) {
    return (
      <main className="page-loading" aria-busy="true">
        Mapping your river…
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="page-loading" aria-busy="true">
        Returning to login…
      </main>
    );
  }

  function openNode(node: KnowledgeNode) {
    router.push(`/bookmarks/${encodeURIComponent(node.id)}`);
  }

  return (
    <main className="graph-page">
      <header className="graph-topbar">
        <Link className="graph-wordmark" href="/graph">
          <span className="site-mark" aria-hidden="true">
            RR
          </span>
          <span>RECOIL RIVER</span>
        </Link>
        <p>
          PRIVATE GRAPH <span aria-hidden="true">/</span>{' '}
          {graph.nodes.length} {graph.nodes.length === 1 ? 'NODE' : 'NODES'}
        </p>
      </header>

      <section className="graph-stage" ref={stageRef}>
        <div className="graph-stage-title">
          <p>YOUR LIBRARY, CONNECTED</p>
          <h1>Your second brain.</h1>
        </div>
        <DynamicKnowledgeGraph
          graph={graph}
          width={viewport.width}
          height={viewport.height}
          variant="fullscreen"
          onNodeClick={openNode}
        />

        {graph.nodes.length > 0 ? (
          <details className="graph-node-index">
            <summary>OPEN A BOOKMARK</summary>
            <ol>
              {graph.nodes.map((node) => (
                <li key={node.id}>
                  <Link
                    href={`/bookmarks/${encodeURIComponent(node.id)}`}
                    aria-label={`Open ${node.title}`}
                  >
                    <span>{node.title}</span>
                    <small>{node.domain}</small>
                  </Link>
                </li>
              ))}
            </ol>
          </details>
        ) : null}
      </section>
    </main>
  );
}
