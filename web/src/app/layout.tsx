import '@fontsource-variable/space-grotesk/wght.css';
import '@recoil-river/graph/styles.css';

import type {Metadata} from 'next';
import type {ReactNode} from 'react';

import {ConvexClientProvider} from '@/components/providers/ConvexClientProvider';

import './globals.css';

export const metadata: Metadata = {
  title: 'Recoil River',
  description: 'A private knowledge river for the pages you choose to save.',
};

export default function RootLayout({children}: Readonly<{children: ReactNode}>) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
