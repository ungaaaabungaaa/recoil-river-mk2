import {Button} from '@astryxdesign/core/Button';

export default function LoginPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-[var(--color-background-body)] p-[var(--spacing-6)]">
      <section
        className="grid w-full max-w-lg gap-[var(--spacing-5)] rounded-[var(--radius-page)] bg-[var(--color-background-surface)] p-[clamp(var(--spacing-6),6vw,var(--spacing-12))] text-[var(--color-text-primary)] shadow-[var(--shadow-high)]"
        aria-labelledby="login-title"
      >
        <p className="m-0 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">RECOIL RIVER</p>
        <h1 id="login-title" className="m-0 text-4xl font-bold tracking-[-0.04em]">Enter your river</h1>
        <p className="m-0 text-base leading-relaxed text-[var(--color-text-secondary)]">Choose how you want to continue. Authentication connects here next.</p>
        <nav className="flex flex-wrap gap-[var(--spacing-3)]" aria-label="Account access">
          <Button className="!min-w-32" label="Log in" size="lg" variant="primary" type="button" />
          <Button className="!min-w-32" label="Register" size="lg" variant="secondary" type="button" />
        </nav>
      </section>
    </main>
  );
}
