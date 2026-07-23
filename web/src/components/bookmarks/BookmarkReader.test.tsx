import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {BookmarkReader} from './BookmarkReader';

const bookmark = {
  id: 'bookmark-1',
  title: 'A useful article',
  domain: 'example.com',
  originalUrl: 'https://example.com/article',
  canonicalUrl: 'https://example.com/article',
  enrichmentStatus: 'ready' as const,
  createdAt: 1,
  updatedAt: 2,
  summary: 'A concise summary.',
  topics: ['knowledge graphs', 'research', 'design'],
  entities: ['Convex'],
  language: 'en',
  markdown: [
    '# Article body',
    '',
    '[External source](https://outside.example/read)',
    '',
    '<script>window.pwned = true</script>',
  ].join('\n'),
  markdownTruncated: false,
};

describe('BookmarkReader', () => {
  it('renders bookmark details and safe Markdown links', () => {
    const {container} = render(<BookmarkReader bookmark={bookmark} />);

    expect(
      screen.getByRole('heading', {name: 'A useful article'}),
    ).toBeInTheDocument();
    expect(screen.getByText('A concise summary.')).toBeInTheDocument();
    expect(screen.getByText('knowledge graphs')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'External source'})).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    expect(screen.getByRole('link', {name: 'External source'})).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(container.querySelector('script')).toBeNull();
  });

  it('shows extracted content when semantic analysis fails', () => {
    render(
      <BookmarkReader
        bookmark={{
          ...bookmark,
          enrichmentStatus: 'failed',
          summary: undefined,
          topics: [],
          entities: [],
          failureMessage: 'A provider returned an invalid response.',
        }}
      />,
    );

    expect(screen.getByText('Article body')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'A provider returned an invalid response.',
    );
  });

  it('renders a private not-found state', () => {
    render(<BookmarkReader bookmark={null} />);

    expect(
      screen.getByRole('heading', {name: 'Bookmark not found'}),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not exist or belongs to another account/i),
    ).toBeInTheDocument();
  });
});
