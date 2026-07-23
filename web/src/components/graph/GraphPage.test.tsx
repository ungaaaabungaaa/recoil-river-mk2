import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {KnowledgeGraph, KnowledgeNode} from '@recoil-river/graph';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: {isAuthenticated: true, isLoading: false},
  push: vi.fn(),
  replace: vi.fn(),
  useQuery: vi.fn(),
}));

vi.mock('@convex-dev/auth/react', () => ({
  useConvexAuth: () => mocks.auth,
}));

vi.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mocks.useQuery(...args),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({push: mocks.push, replace: mocks.replace}),
}));

vi.mock('@recoil-river/backend/api', () => ({
  api: {graph: {getPopupSnapshot: 'graph:getPopupSnapshot'}},
}));

vi.mock('./DynamicKnowledgeGraph', () => ({
  DynamicKnowledgeGraph: ({
    graph,
    onNodeClick,
  }: {
    graph: KnowledgeGraph;
    onNodeClick?(node: KnowledgeNode): void;
  }) => (
    <button
      type="button"
      aria-label={`Rendered force graph with ${graph.nodes.length} nodes`}
      onClick={() => graph.nodes[0] && onNodeClick?.(graph.nodes[0])}
    >
      Shared force graph
    </button>
  ),
}));

import {GraphPage} from './GraphPage';

const graph = {
  nodes: [
    {
      id: 'bookmark-one',
      title: 'Connected article',
      domain: 'example.com',
      enrichmentStatus: 'ready' as const,
      createdAt: 1,
    },
  ],
  edges: [],
};

describe('GraphPage', () => {
  beforeEach(() => {
    mocks.auth.isAuthenticated = true;
    mocks.auth.isLoading = false;
    mocks.push.mockReset();
    mocks.replace.mockReset();
    mocks.useQuery.mockReset();
    mocks.useQuery.mockReturnValue(graph);
  });

  it('redirects signed-out visitors through login and preserves /graph', async () => {
    mocks.auth.isAuthenticated = false;
    mocks.useQuery.mockReturnValue(undefined);

    render(<GraphPage />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith(
        '/login?returnTo=%2Fgraph',
      );
    });
    expect(mocks.useQuery).toHaveBeenCalledWith(
      'graph:getPopupSnapshot',
      'skip',
    );
  });

  it('shows a private loading state while the graph snapshot arrives', () => {
    mocks.useQuery.mockReturnValue(undefined);

    render(<GraphPage />);

    expect(screen.getByText('Mapping your river…')).toBeInTheDocument();
  });

  it('renders the shared graph and opens a selected private reader', () => {
    render(<GraphPage />);

    expect(
      screen.getByRole('heading', {name: 'Your second brain.'}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: 'Rendered force graph with 1 nodes'}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: 'Open Connected article'}),
    ).toHaveAttribute('href', '/bookmarks/bookmark-one');

    fireEvent.click(screen.getByText('Shared force graph'));
    expect(mocks.push).toHaveBeenCalledWith('/bookmarks/bookmark-one');
  });
});
