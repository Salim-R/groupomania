'use client';

import { useOptimistic, useTransition } from 'react';

import { toggleLikeAction } from '@/app/actions/projects';
import { useSession } from '@/components/session-provider';

/**
 * Bouton « j'aime » à mise à jour optimiste.
 *
 * `useOptimistic` affiche le nouvel état dès le clic. La valeur de référence
 * vient des propriétés, donc du serveur : quand `revalidatePath` a réévalué la
 * page, l'état optimiste est abandonné et remplacé par la valeur réelle. En cas
 * d'échec, rien n'ayant changé côté serveur, l'affichage revient de lui-même à
 * son état d'origine - aucun retour arrière à écrire.
 *
 * Le compteur reste visible pour un visiteur non connecté, mais le bouton est
 * désactivé et explique pourquoi plutôt que d'échouer silencieusement.
 */
export function LikeButton({
  projectId,
  count,
  liked,
}: {
  projectId: string;
  count: number;
  liked: boolean;
}) {
  const { isAuthenticated } = useSession();
  const [pending, startTransition] = useTransition();

  // L'écart est calculé par rapport à l'état confirmé par le serveur, et non
  // par incrément sur l'état affiché : deux clics rapides ne peuvent donc pas
  // faire dériver le compteur.
  const [optimistic, applyOptimistic] = useOptimistic({ count, liked }, (_state, next: boolean) => ({
    liked: next,
    count: count + (next ? 1 : 0) - (liked ? 1 : 0),
  }));

  const toggle = () => {
    const next = !optimistic.liked;

    startTransition(async () => {
      applyOptimistic(next);
      await toggleLikeAction(projectId, next);
    });
  };

  const label = optimistic.liked ? 'Retirer mon appréciation' : 'Marquer comme apprécié';

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!isAuthenticated || pending}
      aria-pressed={optimistic.liked}
      title={isAuthenticated ? undefined : 'Connectez-vous pour apprécier un carnet.'}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed ${
        optimistic.liked
          ? 'border-brass bg-brass-wash text-brass-strong'
          : 'border-rule-strong text-ink-muted hover:text-ink'
      }`}
    >
      <span aria-hidden="true">{optimistic.liked ? '★' : '☆'}</span>
      <span>{label}</span>
      <span className="font-medium tabular-nums">{optimistic.count}</span>
    </button>
  );
}
