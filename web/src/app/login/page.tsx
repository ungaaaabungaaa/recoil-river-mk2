'use client';

import {useAuthActions, useConvexAuth} from '@convex-dev/auth/react';
import {useRouter, useSearchParams} from 'next/navigation';
import {Suspense, useEffect, useState} from 'react';

import {LoginForm, type LoginFlow} from '@/components/auth/LoginForm';
import {safeReturnTo} from '@/lib/returnTo';

function readableAuthError(error: unknown, flow: LoginFlow) {
  if (error instanceof Error && /invalid credentials/i.test(error.message)) {
    return 'That email and password combination was not found.';
  }
  if (error instanceof Error && /already exists|duplicate/i.test(error.message)) {
    return 'An account already exists for this email.';
  }
  return flow === 'signIn'
    ? 'Could not log in. Check your details and try again.'
    : 'Could not create this account. Try again.';
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const {isAuthenticated, isLoading} = useConvexAuth();
  const {signIn} = useAuthActions();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(returnTo);
    }
  }, [isAuthenticated, isLoading, returnTo, router]);

  async function submit(args: {
    email: string;
    password: string;
    flow: LoginFlow;
  }) {
    setError(undefined);
    setIsSubmitting(true);
    try {
      await signIn('password', args);
    } catch (caught) {
      setError(readableAuthError(caught, args.flow));
      setIsSubmitting(false);
    }
  }

  return (
    <LoginForm
      error={error}
      isSubmitting={isSubmitting}
      onSubmit={submit}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="page-loading" aria-busy="true">
          Loading Recoil River…
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
