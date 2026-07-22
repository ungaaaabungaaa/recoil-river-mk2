import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import {Roboto} from 'next/font/google';
import './globals.css';

const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Recoil River',
  description: 'A private knowledge river for the pages you choose to save.',
};

export default function RootLayout({children}: Readonly<{children: ReactNode}>) {
  return (
    <html lang="en">
      <body className={roboto.className}>{children}</body>
    </html>
  );
}
