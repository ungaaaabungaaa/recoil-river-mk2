'use client';

import {useConvexAuth} from '@convex-dev/auth/react';
import {api} from '@recoil-river/backend/api';
import type {Id} from '@recoil-river/backend/dataModel';
import {useQuery} from 'convex/react';
import {useParams, useRouter} from 'next/navigation';
import {useEffect} from 'react';

import {BookmarkReader} from '@/components/bookmarks/BookmarkReader';

export default function BookmarkPage() {
  const params = useParams<{id: string}>();
  const router = useRouter();
  const {isAuthenticated, isLoading: isAuthLoading} = useConvexAuth();
  const bookmarkId = params.id as Id<'bookmarks'>;
  const bookmark = useQuery(
    api.bookmarks.getById,
    isAuthenticated ? {bookmarkId} : 'skip',
  );

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      const returnTo = `/bookmarks/${encodeURIComponent(params.id)}`;
      router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [isAuthLoading, isAuthenticated, params.id, router]);

  if (isAuthLoading || (isAuthenticated && bookmark === undefined)) {
    return (
      <main className="page-loading" aria-busy="true">
        Reading your river…
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

  return (
    <BookmarkReader
      bookmark={
        bookmark
          ? {
              ...bookmark,
              id: String(bookmark.id),
            }
          : null
      }
    />
  );
}
