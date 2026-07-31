import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthForm } from '@/components/auth-form';

export const metadata: Metadata = {
  title: 'Se connecter',
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">Se connecter</h1>
      <p className="mt-2 mb-8 text-ink-muted">
        Reprenez vos carnets là où vous les avez laissés.
      </p>

      {/* useSearchParams impose une frontière de suspension côté serveur. */}
      <Suspense fallback={null}>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
