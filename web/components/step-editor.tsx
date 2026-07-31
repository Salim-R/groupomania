'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useTransition } from 'react';

import {
  addStepAction,
  deleteStepAction,
  moveStepAction,
  type FormState,
} from '@/app/actions/projects';
import { useSession } from '@/components/session-provider';
import { Field } from '@/components/ui/field';
import { ImageField } from '@/components/ui/image-field';
import { SubmitButton } from '@/components/ui/submit-button';
import type { Step } from '@/lib/types';

const initialState: FormState = {};

/**
 * Gestion des étapes, réservée à l'auteur du carnet.
 *
 * Le réordonnancement se fait par deux boutons plutôt que par glisser-déposer.
 * Ce n'est pas un repli faute de mieux : un glisser-déposer est inutilisable au
 * clavier, difficile à annoncer par un lecteur d'écran et pénible sur un écran
 * tactile étroit. Deux boutons couvrent tous les cas, et l'annonce
 * « Descendre l'étape 2 » est immédiatement compréhensible.
 *
 * Les étapes affichées viennent du serveur, réévaluées par `revalidatePath`
 * après chaque action : aucune copie locale à tenir à jour, donc aucun risque
 * de divergence entre la numérotation affichée et celle en base.
 */
export function StepEditor({
  projectId,
  authorId,
  steps,
}: {
  projectId: string;
  authorId: string;
  steps: Step[];
}) {
  const { isMe } = useSession();
  const router = useRouter();
  const [moving, startMoving] = useTransition();

  const action = addStepAction.bind(null, projectId);
  const [state, formAction] = useActionState(action, initialState);

  // L'API refuse de toute façon toute écriture d'un tiers : ce test évite
  // seulement d'afficher une interface qui ne servirait à rien.
  if (!isMe(authorId)) return null;

  // `revalidatePath` invalide le cache de la route, mais seule une nouvelle
  // demande redemande la page : une soumission de formulaire s'en charge
  // d'elle-même, un appel d'action déclenché à la main non.
  const move = (step: Step, direction: -1 | 1) => {
    startMoving(async () => {
      await moveStepAction(projectId, step.id, step.position + direction);
      router.refresh();
    });
  };

  const remove = (step: Step) => {
    startMoving(async () => {
      await deleteStepAction(projectId, step.id);
      router.refresh();
    });
  };

  return (
    <section
      aria-labelledby="titre-gestion"
      className="mt-12 rounded-lg border border-dashed border-rule-strong p-6"
    >
      <h2 id="titre-gestion" className="font-display text-xl font-semibold text-ink">
        Tenir le carnet
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Visible de vous seul. Ajoutez une étape à chaque avancée du travail.
      </p>

      {steps.length > 0 && (
        <ol className="mt-6 flex flex-col gap-2">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className="flex flex-wrap items-center gap-3 rounded-md border border-rule bg-paper-raised px-3 py-2"
            >
              <span className="font-display text-sm text-ink-faint tabular-nums">
                {step.position}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{step.title}</span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(step, -1)}
                  disabled={index === 0 || moving}
                  aria-label={`Remonter l'étape « ${step.title} »`}
                  className="rounded border border-rule-strong px-2 py-1 text-xs text-ink-muted transition-colors hover:text-ink disabled:opacity-30"
                >
                  <span aria-hidden="true">↑</span>
                </button>

                <button
                  type="button"
                  onClick={() => move(step, 1)}
                  disabled={index === steps.length - 1 || moving}
                  aria-label={`Descendre l'étape « ${step.title} »`}
                  className="rounded border border-rule-strong px-2 py-1 text-xs text-ink-muted transition-colors hover:text-ink disabled:opacity-30"
                >
                  <span aria-hidden="true">↓</span>
                </button>

                <button
                  type="button"
                  onClick={() => remove(step)}
                  disabled={moving}
                  aria-label={`Supprimer l'étape « ${step.title} »`}
                  className="rounded border border-rule-strong px-2 py-1 text-xs text-ink-muted transition-colors hover:border-alert hover:text-alert disabled:opacity-30"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* La clé dérive du nombre d'étapes, donc de la donnée serveur : après un
          ajout réussi, elle change, React remonte le formulaire et les champs
          se vident d'eux-mêmes. Aucun effet ni appel à reset() n'est requis. */}
      <form
        key={`etape-${steps.length}`}
        action={formAction}
        noValidate
        className="mt-6 flex flex-col gap-4"
      >
        {state.message && (
          <p role="alert" className="rounded-md border border-alert bg-alert-wash px-3 py-2 text-sm">
            {state.message}
          </p>
        )}

        <Field
          label="Titre de l'étape"
          name="title"
          required
          maxLength={120}
          placeholder="Corroyage, collage, ponçage…"
          error={state.errors?.title}
        />

        <Field
          label="Ce que vous avez fait"
          name="body"
          multiline
          rows={3}
          maxLength={2000}
          hint="Facultatif. Les difficultés rencontrées valent souvent plus que le résultat."
          error={state.errors?.body}
        />

        <ImageField name="image" label="Photo" serverError={state.errors?.image} />

        <SubmitButton pendingLabel="Ajout…" className="self-start">
          Ajouter l&apos;étape
        </SubmitButton>
      </form>
    </section>
  );
}
