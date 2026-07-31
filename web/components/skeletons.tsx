/**
 * Squelettes de chargement.
 *
 * Ils reproduisent la géométrie exacte du contenu final : mêmes rapports de
 * forme, mêmes hauteurs de ligne, mêmes espacements. Un squelette approximatif
 * est pire qu'un simple indicateur d'attente, parce qu'il provoque un décalage
 * de mise en page à l'arrivée des données, ce que mesure précisément le CLS.
 *
 * L'animation est portée par une classe utilitaire unique, et la préférence
 * `prefers-reduced-motion` la neutralise depuis la feuille globale.
 */

const shimmer = 'animate-pulse bg-paper-sunken';

export function ProjectCardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg border border-rule bg-paper-raised shadow-card"
      // Retiré de l'arbre d'accessibilité : un lecteur d'écran n'a rien à
      // annoncer d'une forme vide. L'état de chargement est signalé une seule
      // fois, sur le conteneur de la liste.
      aria-hidden="true"
    >
      <div className={`aspect-[3/2] ${shimmer}`} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <div className={`h-5 w-20 rounded-full ${shimmer}`} />
          <div className={`h-4 w-16 rounded ${shimmer}`} />
        </div>
        <div className={`h-6 w-4/5 rounded ${shimmer}`} />
        <div className={`h-4 w-full rounded ${shimmer}`} />
        <div className={`h-4 w-2/3 rounded ${shimmer}`} />
      </div>

      <div className="flex items-center gap-2 border-t border-rule px-4 py-3">
        <div className={`size-6 rounded-full ${shimmer}`} />
        <div className={`h-4 w-28 rounded ${shimmer}`} />
        <div className={`ms-auto h-3 w-20 rounded ${shimmer}`} />
      </div>
    </div>
  );
}

export function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Chargement des carnets…</span>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <ProjectCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StepListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="mt-6 flex flex-col gap-8">
      <span className="sr-only">Chargement du déroulé…</span>

      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="relative ps-10" aria-hidden="true">
          <span className={`absolute start-0 top-0 size-7 rounded-full ${shimmer}`} />
          <div className={`h-6 w-1/2 rounded ${shimmer}`} />
          <div className={`mt-3 h-4 w-full rounded ${shimmer}`} />
          <div className={`mt-2 h-4 w-4/5 rounded ${shimmer}`} />
        </div>
      ))}
    </div>
  );
}

export function CommentsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="mt-6 flex flex-col gap-5">
      <span className="sr-only">Chargement des échanges…</span>

      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex gap-3" aria-hidden="true">
          <div className={`size-8 shrink-0 rounded-full ${shimmer}`} />
          <div className="flex-1">
            <div className={`h-4 w-40 rounded ${shimmer}`} />
            <div className={`mt-2 h-4 w-full rounded ${shimmer}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ArtisanListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="mt-8">
      <span className="sr-only">Chargement des ateliers…</span>

      <ul className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <div
              className="flex gap-4 rounded-lg border border-rule bg-paper-raised p-4"
              aria-hidden="true"
            >
              <div className={`size-16 shrink-0 rounded-full ${shimmer}`} />
              <div className="flex-1">
                <div className={`h-6 w-2/3 rounded ${shimmer}`} />
                <div className={`mt-2 h-4 w-1/2 rounded ${shimmer}`} />
                <div className={`mt-3 h-4 w-full rounded ${shimmer}`} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
