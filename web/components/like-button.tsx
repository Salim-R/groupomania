'use client';

import Link from 'next/link';
import { useOptimistic, useTransition } from 'react';

import { toggleLikeAction } from '@/app/actions/projects';
import { useSession } from '@/components/session-provider';

const habillage =
  'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors';

/**
 * Bouton « j'aime » à mise à jour optimiste.
 *
 * `useOptimistic` affiche le nouvel état dès le clic. La valeur de référence
 * vient des propriétés, donc du serveur : quand `revalidatePath` a réévalué la
 * page, l'état optimiste est abandonné et remplacé par la valeur réelle. En cas
 * d'échec, rien n'ayant changé côté serveur, l'affichage revient de lui-même à
 * son état d'origine - aucun retour arrière à écrire.
 *
 * Un visiteur non connecté ne reçoit pas un bouton désactivé mais un lien vers
 * la page de connexion : un contrôle désactivé n'est pas focusable, si bien
 * qu'au clavier l'explication portée par son `title` reste inaccessible. Le
 * lien, lui, s'annonce, se focalise, et mène là où il faut aller.
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

  if (!isAuthenticated) {
    return (
      <Link
        href="/connexion"
        className={`${habillage} border-rule-strong text-ink-muted hover:text-ink`}
      >
        <span aria-hidden="true">☆</span>
        <span>Connectez-vous pour apprécier</span>
        <span className="font-medium tabular-nums">{count}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={optimistic.liked}
      className={`${habillage} disabled:cursor-not-allowed ${
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
