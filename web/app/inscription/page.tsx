import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthForm } from '@/components/auth-form';

export const metadata: Metadata = {
  title: 'Ouvrir un atelier',
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">Ouvrir un atelier</h1>
      <p className="mt-2 mb-8 text-ink-muted">
        Un compte suffit pour tenir vos carnets et les rendre publics.
      </p>

      <Suspense fallback={null}>
        <AuthForm mode="register" />
      </Suspense>
    </div>
  );
}
