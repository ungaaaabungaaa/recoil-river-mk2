import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

type ReaderBookmark = {
  id: string;
  title: string;
  domain: string;
  originalUrl: string;
  canonicalUrl: string;
  enrichmentStatus:
    | 'queued'
    | 'extracting'
    | 'analyzing'
    | 'indexing'
    | 'ready'
    | 'retrying'
    | 'failed';
  createdAt: number;
  updatedAt: number;
  summary?: string;
  topics: string[];
  entities: string[];
  language?: string;
  markdown?: string;
  markdownTruncated?: boolean;
  failureMessage?: string;
};

const statusLabel: Record<ReaderBookmark['enrichmentStatus'], string> = {
  queued: 'Queued for reading',
  extracting: 'Reading source',
  analyzing: 'Finding ideas',
  indexing: 'Connecting graph',
  ready: 'Connected',
  retrying: 'Retrying enrichment',
  failed: 'Partial result',
};

export function BookmarkReader({
  bookmark,
}: {
  bookmark: ReaderBookmark | null;
}) {
  if (!bookmark) {
    return (
      <main className="reader-not-found">
        <p className="reader-eyebrow">PRIVATE LIBRARY</p>
        <h1>Bookmark not found</h1>
        <p>This bookmark does not exist or belongs to another account.</p>
        <Link href="/">Return to Recoil River</Link>
      </main>
    );
  }

  return (
    <main className="reader-page">
      <header className="reader-topbar">
        <Link className="reader-wordmark" href="/">
          RECOIL RIVER
        </Link>
        <span className={`reader-status reader-status--${bookmark.enrichmentStatus}`}>
          {statusLabel[bookmark.enrichmentStatus]}
        </span>
      </header>

      <article className="reader-article">
        <header className="reader-hero">
          <p className="reader-eyebrow">{bookmark.domain}</p>
          <h1>{bookmark.title}</h1>
          <a
            className="reader-source"
            href={bookmark.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open original source ↗
          </a>
        </header>

        {bookmark.failureMessage ? (
          <aside className="reader-notice" role="status">
            <strong>Saved, with partial enrichment.</strong>
            <span>{bookmark.failureMessage}</span>
          </aside>
        ) : null}

        {bookmark.summary ? (
          <section className="reader-summary" aria-labelledby="summary-title">
            <p id="summary-title">SUMMARY</p>
            <blockquote>{bookmark.summary}</blockquote>
            {bookmark.topics.length > 0 ? (
              <ul aria-label="Topics">
                {bookmark.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {bookmark.markdown ? (
          <section className="reader-content">
            <ReactMarkdown
              components={{
                a({children, href}) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  );
                },
                img({alt, src}) {
                  return typeof src === 'string' ? (
                    <a href={src} target="_blank" rel="noopener noreferrer">
                      View source image{alt ? `: ${alt}` : ''}
                    </a>
                  ) : null;
                },
              }}
            >
              {bookmark.markdown}
            </ReactMarkdown>
            {bookmark.markdownTruncated ? (
              <p className="reader-truncated">
                This saved extraction was capped at 500 KB.
              </p>
            ) : null}
          </section>
        ) : (
          <section className="reader-content-pending" role="status">
            <p>The original link is saved.</p>
            <span>Readable content will appear after extraction succeeds.</span>
          </section>
        )}
      </article>
    </main>
  );
}
