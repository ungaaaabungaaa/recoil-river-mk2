'use client';

import {Button} from '@astryxdesign/core/Button';
import {useConvexAuth} from '@convex-dev/auth/react';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';

const artLayers = [
  {asset: '/art-1.png', className: 'left-0 top-[2%] w-[20%]'},
  {asset: '/art-2.png', className: 'bottom-[4%] left-0 w-[24%]'},
  {asset: '/art-3.png', className: 'right-[4%] top-[8%] w-[30%]'},
  {asset: '/art-4.png', className: 'left-1/2 top-1/2 w-[38%] -translate-x-1/2 -translate-y-1/2'},
] as const;

export function SplashScreen() {
  const router = useRouter();
  const {isAuthenticated, isLoading} = useConvexAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/graph');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <main
      className="relative min-h-svh bg-[var(--color-background-surface)]"
      aria-labelledby="splash-title"
    >
      <section
        className="relative isolate min-h-svh overflow-hidden bg-black"
        aria-label="Recoil River splash screen"
      >
        <h1 id="splash-title" className="sr-only">
          Recoil River
        </h1>

        <span className="absolute inset-0 block overflow-hidden" aria-hidden="true">
          {artLayers.map(({asset, className}) => (
            <span
              className={`absolute aspect-square bg-contain bg-center bg-no-repeat ${className}`}
              data-testid="splash-art-layer"
              key={asset}
              style={{backgroundImage: `url("${asset}")`}}
            />
          ))}
        </span>

        <aside className="absolute bottom-[clamp(var(--spacing-5),5vw,var(--spacing-12))] right-[clamp(var(--spacing-5),5vw,var(--spacing-12))] z-10 max-[48rem]:bottom-[var(--spacing-6)] max-[48rem]:right-[var(--spacing-6)]">
          <span id="splash-cta-description" className="sr-only">
            Enter Recoil River and open the login page.
          </span>
          <Button
            aria-describedby="splash-cta-description"
            className="!min-h-[5.5rem] !min-w-[13rem] !rounded-[var(--radius-page)] !border-0 !bg-[var(--color-on-dark)] !px-[clamp(var(--spacing-12),10vw,var(--spacing-24))] !py-[clamp(3rem,8vw,8rem)] !text-[clamp(1.75rem,4vw,3.5rem)] !font-bold !tracking-[-0.04em] !text-[var(--color-on-light)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:!bg-[var(--color-on-dark)] hover:!text-[var(--color-on-light)] hover:!shadow-[var(--shadow-high)] focus-visible:!outline-2 focus-visible:!outline-offset-4 focus-visible:!outline-[var(--color-on-dark)] max-[48rem]:!min-h-[4.5rem] max-[48rem]:!min-w-[11rem]"
            label="FU*K ME"
            size="lg"
            type="button"
            variant="primary"
            onClick={() => router.push('/login?returnTo=%2Fgraph')}
          />
        </aside>
      </section>
    </main>
  );
}
