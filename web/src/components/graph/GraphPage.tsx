'use client';

import {useConvexAuth} from '@convex-dev/auth/react';
import {api} from '@recoil-river/backend/api';
import type {BookmarkDetail, RecentBookmark} from '@recoil-river/backend/contracts';
import type {Id} from '@recoil-river/backend/dataModel';
import type {KnowledgeGraph, KnowledgeNode} from '@recoil-river/graph';
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

function statusLabel(status: RecentBookmark['enrichmentStatus']) {
  switch (status) {
    case 'ready':
      return 'CONNECTED';
    case 'failed':
      return 'PARTIAL';
    case 'retrying':
      return 'RETRYING';
    case 'queued':
      return 'QUEUED';
    case 'extracting':
      return 'READING';
    case 'analyzing':
      return 'ANALYZING';
    case 'indexing':
      return 'INDEXING';
  }
}

function faviconInitial(domain: string) {
  return domain.trim().charAt(0).toUpperCase() || 'R';
}

function FaviconVisual({bookmark}: {bookmark: RecentBookmark}) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="river-bookmark-visual" aria-hidden="true">
      {bookmark.faviconUrl && !failed ? (
        // User-provided favicon hosts cannot be enumerated for next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bookmark.faviconUrl}
          alt=""
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="river-bookmark-initial">
          {faviconInitial(bookmark.domain)}
        </span>
      )}
    </span>
  );
}

function BookmarkCard({
  bookmark,
  selected,
  onSelect,
}: {
  bookmark: RecentBookmark;
  selected: boolean;
  onSelect(): void;
}) {
  return (
    <button
      className={`river-bookmark-card${selected ? ' is-selected' : ''}`}
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
    >
      <FaviconVisual bookmark={bookmark} />
      <span className="river-bookmark-card__veil" aria-hidden="true" />
      <span className="river-bookmark-card__copy">
        <strong>{bookmark.title}</strong>
        <small>{bookmark.domain}</small>
      </span>
      <span className="river-bookmark-card__status">
        {statusLabel(bookmark.enrichmentStatus)}
      </span>
    </button>
  );
}

function BookmarkPanel({
  recent,
  selectedId,
  detail,
  onSelect,
  onBack,
}: {
  recent?: RecentBookmark[];
  selectedId: Id<'bookmarks'> | null;
  detail?: BookmarkDetail | null;
  onSelect(bookmarkId: Id<'bookmarks'>): void;
  onBack(): void;
}) {
  if (selectedId) {
    if (detail === undefined) {
      return (
        <aside className="river-panel" aria-label="Bookmark details">
          <div className="river-panel-loading" role="status">
            Loading bookmark…
          </div>
        </aside>
      );
    }

    if (!detail) {
      return (
        <aside className="river-panel" aria-label="Bookmark details">
          <button className="river-panel-back" type="button" onClick={onBack}>
            ← <span>Back to river</span>
          </button>
          <div className="river-panel-empty">
            <p className="river-panel-eyebrow">PRIVATE LIBRARY</p>
            <h2>Bookmark unavailable.</h2>
            <p>This bookmark is missing or belongs to another account.</p>
          </div>
        </aside>
      );
    }

    return (
      <aside className="river-panel river-panel--detail" aria-label="Bookmark details">
        <button className="river-panel-back" type="button" onClick={onBack}>
          ← <span>Back to river</span>
        </button>
        <div className="river-detail-hero">
          <FaviconVisual bookmark={detail} />
          <p className="river-panel-eyebrow">{detail.domain}</p>
          <h2>{detail.title}</h2>
          <span className={`river-detail-status river-detail-status--${detail.enrichmentStatus}`}>
            {statusLabel(detail.enrichmentStatus)}
          </span>
        </div>

        <div className="river-detail-body">
          <a
            className="river-detail-source"
            href={detail.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open original source ↗
          </a>

          {detail.summary ? (
            <section className="river-detail-section" aria-labelledby="river-summary-title">
              <p id="river-summary-title" className="river-panel-eyebrow">
                SUMMARY
              </p>
              <p className="river-detail-summary">{detail.summary}</p>
            </section>
          ) : null}

          {detail.topics.length > 0 ? (
            <section className="river-detail-section" aria-labelledby="river-topics-title">
              <p id="river-topics-title" className="river-panel-eyebrow">
                TOPICS
              </p>
              <ul className="river-topic-list">
                {detail.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {detail.failureMessage ? (
            <p className="river-detail-failure" role="status">
              {detail.failureMessage}
            </p>
          ) : null}

          <Link
            className="river-detail-reader-link"
            href={`/bookmarks/${encodeURIComponent(String(detail.id))}`}
          >
            Open full reader
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside className="river-panel" aria-label="Saved links">
      <div className="river-panel-heading">
        <div>
          <p className="river-panel-eyebrow">YOUR LIBRARY</p>
          <h2>RIVER</h2>
        </div>
        <span className="river-panel-mark" aria-hidden="true">
          RR
        </span>
      </div>
      <p className="river-panel-intro">
        A list of links you have added and the connections we found.
      </p>
      <div className="river-panel-rule">
        <span>TODAY</span>
      </div>

      {recent === undefined ? (
        <div className="river-panel-loading" role="status">
          Gathering your links…
        </div>
      ) : recent.length > 0 ? (
        <div className="river-bookmark-grid">
          {recent.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              selected={false}
              onSelect={() => onSelect(bookmark.id)}
            />
          ))}
        </div>
      ) : (
        <div className="river-panel-empty">
          <p className="river-panel-eyebrow">NO LINKS YET</p>
          <h2>Your river starts here.</h2>
          <p>Save a page with the Chrome extension to make your first node.</p>
        </div>
      )}
    </aside>
  );
}

export function GraphPage() {
  const router = useRouter();
  const {isAuthenticated, isLoading: isAuthLoading} = useConvexAuth();
  const snapshot = useQuery(
    api.graph.getPopupSnapshot,
    isAuthenticated ? {} : 'skip',
  );
  const recent = useQuery(
    api.bookmarks.listRecent,
    isAuthenticated ? {} : 'skip',
  );
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<Id<'bookmarks'> | null>(null);
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

  const activeSelectedBookmarkId =
    selectedBookmarkId &&
    graph.nodes.some((node) => node.id === String(selectedBookmarkId))
      ? selectedBookmarkId
      : null;
  const detail = useQuery(
    api.bookmarks.getById,
    isAuthenticated && activeSelectedBookmarkId
      ? {bookmarkId: activeSelectedBookmarkId}
      : 'skip',
  );

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
    setSelectedBookmarkId(node.id as Id<'bookmarks'>);
  }

  return (
    <main className="graph-page graph-page--workspace">
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

      <div className="graph-workspace">
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
        </section>

        <BookmarkPanel
          recent={recent}
          selectedId={activeSelectedBookmarkId}
          detail={detail}
          onSelect={setSelectedBookmarkId}
          onBack={() => setSelectedBookmarkId(null)}
        />
      </div>
    </main>
  );
}
