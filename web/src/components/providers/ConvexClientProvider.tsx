'use client';

import {ConvexAuthProvider} from '@convex-dev/auth/react';
import {ConvexReactClient} from 'convex/react';
import {ReactNode, useState} from 'react';

export function ConvexClientProvider({children}: {children: ReactNode}) {
  const [client] = useState(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    return url ? new ConvexReactClient(url) : null;
  });

  if (!client) {
    return (
      <main className="configuration-error">
        <p>Recoil River needs NEXT_PUBLIC_CONVEX_URL before it can connect.</p>
      </main>
    );
  }

  return <ConvexAuthProvider client={client}>{children}</ConvexAuthProvider>;
}
