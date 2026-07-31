import { ProjectGridSkeleton } from '@/components/skeletons';

/**
 * Affiché pendant une navigation vers la racine.
 *
 * Distinct du `fallback` de Suspense dans la page : celui-ci couvre le trajet
 * entre le clic et l'arrivée de la nouvelle page, celui-là couvre l'attente des
 * données une fois la page arrivée. Les deux montrent le même squelette pour
 * que la transition soit continue.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <section className="mb-10 max-w-2xl">
        <h1 className="font-display text-4xl leading-tight font-semibold text-balance text-ink sm:text-5xl">
          Le carnet de bord des ateliers
        </h1>
        <p className="mt-4 text-lg text-pretty text-ink-muted">
          Une table en chêne, une guitare, une réfection de moteur : chaque ouvrage se raconte étape
          par étape. On y montre le travail, pas seulement le résultat.
        </p>
      </section>

      <ProjectGridSkeleton />
    </div>
  );
}
