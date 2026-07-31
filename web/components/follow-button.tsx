'use client';

import { useOptimistic, useTransition } from 'react';

import { toggleFollowAction } from '@/app/actions/projects';
import { useSession } from '@/components/session-provider';

/**
 * Abonnement à un atelier, en mise à jour optimiste.
 *
 * Le bouton n'apparaît ni pour un visiteur non connecté ni sur son propre
 * profil : afficher une action impossible pour la refuser ensuite est un
 * mauvais service rendu.
 */
export function FollowButton({
  artisanId,
  following,
  followers,
}: {
  artisanId: string;
  following: boolean;
  followers: number;
}) {
  const { isAuthenticated, isMe } = useSession();
  const [pending, startTransition] = useTransition();

  const [optimistic, applyOptimistic] = useOptimistic(
    { following, followers },
    (_state, next: boolean) => ({
      following: next,
      followers: followers + (next ? 1 : 0) - (following ? 1 : 0),
    })
  );

  if (!isAuthenticated || isMe(artisanId)) return null;

  const toggle = () => {
    const next = !optimistic.following;

    startTransition(async () => {
      applyOptimistic(next);
      await toggleFollowAction(artisanId, next);
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={optimistic.following}
      className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
        optimistic.following
          ? 'border-rule-strong bg-paper-sunken text-ink-muted'
          : 'border-brass bg-brass text-on-brass hover:bg-brass-strong'
      }`}
    >
      {optimistic.following ? 'Abonné' : "Suivre l'atelier"}
    </button>
  );
}
