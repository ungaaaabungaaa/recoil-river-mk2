'use client';

import {FormEvent, useState} from 'react';

export type LoginFlow = 'signIn' | 'signUp';

export function LoginForm({
  error,
  isSubmitting = false,
  onSubmit,
}: {
  error?: string;
  isSubmitting?: boolean;
  onSubmit(args: {
    email: string;
    password: string;
    flow: LoginFlow;
  }): void | Promise<void>;
}) {
  const [flow, setFlow] = useState<LoginFlow>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit({email, password, flow});
  }

  return (
    <main className="login-page">
      <section className="login-manifesto" aria-label="About Recoil River">
        <header className="site-wordmark">
          <span className="site-mark" aria-hidden="true">
            RR
          </span>
          RECOIL RIVER
        </header>
        <div>
          <p className="login-kicker">RECOIL RIVER / PRIVATE SECOND BRAIN</p>
          <p className="login-display">
            Keep the signal.
            <br />
            lose the noise.
          </p>
        </div>
        <p className="login-index">01 — CAPTURE / 02 — EXTRACT / 03 — CONNECT</p>
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrap">
          <p className="section-number">{flow === 'signIn' ? '01' : '02'}</p>
          <h1>{flow === 'signIn' ? 'Welcome back' : 'Start your river.'}</h1>
          <p className="login-intro">
            {flow === 'signIn'
              ? 'Enter your details to sign in to your account'
              : 'One account. Separate secure sessions for web and Chrome.'}
          </p>

          <form onSubmit={submit}>
            <label>
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                autoComplete={
                  flow === 'signIn' ? 'current-password' : 'new-password'
                }
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error ? <p role="alert">{error}</p> : null}
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? flow === 'signIn'
                  ? 'Logging in…'
                  : 'Creating account…'
                : flow === 'signIn'
                  ? 'Log in'
                  : 'Sign up'}
            </button>
          </form>

          <div className="login-switch-row">
            <span>
              {flow === 'signIn'
                ? "Don't have an account?"
                : 'Already have an account?'}
            </span>
            <button
              className="login-mode-switch"
              type="button"
              onClick={() =>
                setFlow((current) =>
                  current === 'signIn' ? 'signUp' : 'signIn',
                )
              }
            >
              {flow === 'signIn' ? 'Sign up' : 'Log in'}
            </button>
          </div>
          <p className="login-demo-note">
            Hackathon authentication: email verification and password recovery
            are not enabled yet.
          </p>
        </div>
      </section>
    </main>
  );
}
