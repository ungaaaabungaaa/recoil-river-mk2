'use client';

import {Button} from '@astryxdesign/core/Button';
import {useRouter} from 'next/navigation';
import styles from './splash.module.css';

const artLayers = [
  '/splash/art-1.png',
  '/splash/art-2.png',
  '/splash/art-3.png',
  '/splash/art-4.png',
] as const;

export function SplashScreen() {
  const router = useRouter();

  return (
    <main className={styles.frame} aria-labelledby="splash-title">
      <section className={styles.stage} aria-label="Recoil River splash screen">
        <h1 id="splash-title" className={styles.visuallyHidden}>
          Recoil River
        </h1>

        <span className={styles.artwork} aria-hidden="true">
          {artLayers.map((asset, index) => (
            <span
              className={`${styles.artLayer} ${styles[`art${index + 1}`]}`}
              data-testid="splash-art-layer"
              key={asset}
              style={{backgroundImage: `url("${asset}")`}}
            />
          ))}
        </span>

        <aside className={styles.ctaDock}>
          <span id="splash-cta-description" className={styles.visuallyHidden}>
            Enter Recoil River and open the login page.
          </span>
          <Button
            aria-describedby="splash-cta-description"
            className={styles.cta}
            label="FU*K ME"
            size="lg"
            type="button"
            variant="primary"
            onClick={() => router.push('/login')}
          />
        </aside>
      </section>
    </main>
  );
}
