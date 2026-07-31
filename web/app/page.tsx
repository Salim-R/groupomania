import { Suspense } from 'react';

import { ProjectCard } from '@/components/project-card';
import { ProjectGridSkeleton } from '@/components/skeletons';
import { projects } from '@/lib/queries';

/**
 * Fil des carnets.
 *
 * La page n'attend rien : l'accroche et la structure partent immédiatement,
 * et la grille arrive en flux dès que l'API a répondu. Sans cette frontière de
 * suspension, le visiteur resterait devant une page blanche pendant toute la
 * durée de la requête, aussi courte soit-elle — et elle ne l'est pas toujours,
 * l'API étant hébergée séparément.
 */
async function ProjectGrid() {
  let items;

  try {
    const page = await projects.list({ limit: 12 });
    items = page.items;
  } catch {
    // L'API peut être arrêtée en développement, ou redémarrer en production.
    // Un état lisible vaut mieux qu'une page d'erreur qui emporte tout le site.
    return (
      <p
        role="status"
        className="rounded-lg border border-rule bg-alert-wash px-4 py-3 text-sm text-ink"
      >
        Les carnets sont momentanément indisponibles. Réessayez dans un instant.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-rule-strong px-6 py-16 text-center">
        <p className="font-display text-xl text-ink">Aucun carnet pour l&apos;instant.</p>
        <p className="mt-2 text-ink-muted">
          Les premiers ouvrages apparaîtront ici dès qu&apos;un atelier ouvrira son carnet.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((project, index) => (
        <li key={project.id}>
          {/* Seule la première rangée est préchargée : au-delà, les images sont
              sous la ligne de flottaison et se chargent à la demande. */}
          <ProjectCard project={project} priority={index < 3} />
        </li>
      ))}
    </ul>
  );
}

export default function HomePage() {
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

      <Suspense fallback={<ProjectGridSkeleton />}>
        <ProjectGrid />
      </Suspense>
    </div>
  );
}
