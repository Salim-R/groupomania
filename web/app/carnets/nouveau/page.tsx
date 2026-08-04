import type { Metadata } from 'next';

import { ProjectForm } from '@/components/project-form';

export const metadata: Metadata = {
  title: 'Ouvrir un carnet',
};

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">Ouvrir un carnet</h1>
      <p className="mt-2 mb-8 text-ink-muted">
        Présentez votre réalisation. Vous pourrez ensuite ajouter chaque étape du travail.
      </p>

      <ProjectForm />
    </div>
  );
}
