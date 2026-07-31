import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { Avatar } from '@/components/avatar';
import { ArtisanListSkeleton } from '@/components/skeletons';
import { users } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Les artisans',
  description: 'Les ateliers qui tiennent un carnet de bord public.',
};

async function ArtisanList({ craft, city }: { craft?: string; city?: string }) {
  let items;

  try {
    items = await users.list({ craft, city });
  } catch {
    return (
      <p role="status" className="mt-8 rounded-lg border border-rule bg-alert-wash px-4 py-3 text-sm">
        L&apos;annuaire est momentanément indisponible.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="mt-8 rounded-lg border border-dashed border-rule-strong px-6 py-12 text-center text-ink-muted">
        Aucun atelier ne correspond à cette recherche.
      </p>
    );
  }

  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2">
      {items.map((artisan) => (
        <li key={artisan.id}>
          <Link
            href={`/artisans/${artisan.id}`}
            className="flex gap-4 rounded-lg border border-rule bg-paper-raised p-4 transition-colors hover:border-rule-strong"
          >
            <Avatar picture={artisan.picture} pseudo={artisan.pseudo} size="lg" />

            <div className="min-w-0">
              <p className="font-display text-lg font-semibold text-ink">{artisan.pseudo}</p>
              <p className="text-sm text-ink-muted">
                {[artisan.craft, artisan.city].filter(Boolean).join(' · ') || 'Atelier'}
              </p>
              {artisan.bio && (
                <p className="mt-1 line-clamp-2 text-sm text-ink-faint">{artisan.bio}</p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function ArtisansPage({
  searchParams,
}: {
  searchParams: Promise<{ metier?: string; ville?: string }>;
}) {
  const { metier, ville } = await searchParams;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-ink">Les artisans</h1>
      <p className="mt-2 text-ink-muted">
        Les ateliers qui documentent leur travail, métier par métier.
      </p>

      {/* Formulaire en GET : la recherche reste dans l'URL, donc partageable,
          navigable avec les boutons précédent et suivant, et utilisable sans
          JavaScript. */}
      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="metier" className="text-sm font-medium text-ink">
            Métier
          </label>
          <input
            id="metier"
            name="metier"
            defaultValue={metier ?? ''}
            placeholder="Ébénisterie, lutherie…"
            className="rounded-md border border-rule-strong bg-paper-raised px-3 py-2 text-ink placeholder:text-ink-faint"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ville" className="text-sm font-medium text-ink">
            Ville
          </label>
          <input
            id="ville"
            name="ville"
            defaultValue={ville ?? ''}
            placeholder="Sartrouville…"
            className="rounded-md border border-rule-strong bg-paper-raised px-3 py-2 text-ink placeholder:text-ink-faint"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-brass px-4 py-2 text-sm font-medium text-on-brass transition-colors hover:bg-brass-strong"
        >
          Filtrer
        </button>

        {(metier || ville) && (
          <Link href="/artisans" className="text-sm text-ink-muted underline underline-offset-4">
            Tout afficher
          </Link>
        )}
      </form>

      {/* La clé change avec les critères : sans elle, React conserverait le
          contenu déjà rendu au lieu de re-suspendre, et le changement de filtre
          se ferait sans aucun retour visuel. */}
      <Suspense key={`${metier ?? ''}-${ville ?? ''}`} fallback={<ArtisanListSkeleton />}>
        <ArtisanList craft={metier} city={ville} />
      </Suspense>
    </div>
  );
}
