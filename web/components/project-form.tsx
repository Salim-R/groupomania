'use client';

import { useActionState } from 'react';

import { createProjectAction, type FormState } from '@/app/actions/projects';
import { Field } from '@/components/ui/field';
import { ImageField } from '@/components/ui/image-field';
import { SubmitButton } from '@/components/ui/submit-button';

const initialState: FormState = {};

export function ProjectForm() {
  const [state, formAction] = useActionState(createProjectAction, initialState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {state.message && (
        <p role="alert" className="rounded-md border border-alert bg-alert-wash px-3 py-2 text-sm">
          {state.message}
        </p>
      )}

      <Field
        label="Nom du projet"
        name="title"
        required
        minLength={3}
        maxLength={120}
        hint="Ce que vous réalisez, en quelques mots."
        error={errors.title}
      />

      <Field
        label="En deux phrases"
        name="summary"
        multiline
        rows={3}
        maxLength={500}
        hint="Facultatif. La matière, la contrainte principale, la commande."
        error={errors.summary}
      />

      <ImageField
        name="cover"
        label="Photo de couverture"
        hint="Facultatif. JPEG, PNG ou WebP, 5 Mo au maximum."
        serverError={errors.cover}
      />

      <SubmitButton pendingLabel="Ouverture…" className="self-start">
        Publier le projet
      </SubmitButton>
    </form>
  );
}
