import { Suspense } from 'react';

import { ProjectCard } from '@/components/project-card';
import { ProjectGridSkeleton } from '@/components/skeletons';
import { projects } from '@/lib/queries';

/**
 * Fil des projets.
 *
 * La page n'attend rien : l'accroche et la structure partent immédiatement,
 * et la grille arrive en flux dès que l'API a répondu. Sans cette frontière de
 * suspension, le visiteur resterait devant une page blanche pendant toute la
 * durée de la requête, aussi courte soit-elle - et elle ne l'est pas toujours,
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
          Les premiers carnets apparaîtront ici dès qu&apos;un atelier ouvrira le sien.
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
    <div>
      <section className="border-b border-rule bg-paper-raised">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-20">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-brass uppercase">
              La preuve du geste
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.04] font-semibold text-balance text-ink sm:text-6xl">
              Montrez le travail qu&apos;une photo finale ne raconte pas.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-pretty text-ink-muted">
              L&apos;Établi permet aux artisans de documenter un ouvrage étape par étape, puis de
              partager une page claire qui montre la méthode, les choix et le savoir-faire.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#carnets"
                className="rounded-md bg-brass px-5 py-3 font-semibold text-on-brass transition-colors hover:bg-brass-strong"
              >
                Explorer les carnets
              </a>
              <a
                href="/connexion"
                className="rounded-md border border-rule-strong bg-paper px-5 py-3 font-semibold text-ink transition-colors hover:border-brass hover:text-brass-strong"
              >
                Tester l&apos;espace artisan
              </a>
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-2xl border border-rule bg-paper p-6 shadow-card sm:p-8">
            <div aria-hidden="true" className="absolute -top-16 -right-12 size-40 rounded-full bg-brass-wash" />
            <p className="relative text-sm font-semibold text-brass-strong">Un carnet, un lien, toute l&apos;histoire</p>
            <ol className="relative mt-6 space-y-5">
              {[
                ['01', 'Ouvrir le carnet', 'Un titre, une description et une première photo.'],
                ['02', 'Ajouter les étapes', 'Les gestes, les décisions et les images restent dans l’ordre.'],
                ['03', 'Partager l’avancement', 'Le client ou le public suit le travail depuis une page unique.'],
              ].map(([number, title, text]) => (
                <li key={number} className="grid grid-cols-[2.5rem_1fr] gap-3">
                  <span className="font-display text-2xl font-semibold text-brass">{number}</span>
                  <div>
                    <h2 className="font-semibold text-ink">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-ink-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12" aria-labelledby="benefices">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['Documenter', 'Photos et étapes restent réunies dans le bon ordre.'],
            ['Rassurer', 'La méthode de travail devient visible avant même le premier échange.'],
            ['Partager', 'Une seule page remplace les photos dispersées dans les messages.'],
          ].map(([title, text]) => (
            <article key={title} className="rounded-xl border border-rule bg-paper-raised p-5">
              <h2 id={title === 'Documenter' ? 'benefices' : undefined} className="font-display text-xl font-semibold text-ink">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="carnets" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-14">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.18em] text-brass uppercase">Dans les ateliers</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-balance text-ink sm:text-4xl">
            Des ouvrages racontés pendant leur fabrication
          </h2>
          <p className="mt-3 text-ink-muted">
            Forge, mécanique, ébénisterie, céramique ou lutherie : entrez dans le processus, pas seulement dans le résultat.
          </p>
        </div>

        <Suspense fallback={<ProjectGridSkeleton />}>
          <ProjectGrid />
        </Suspense>
      </section>

      <section className="border-t border-rule bg-paper-raised">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl font-semibold text-ink">Essayez le parcours complet</p>
            <p className="mt-2 text-sm text-ink-muted">
              Compte de démonstration : margaux@exemple.fr · mot de passe : atelier2026
            </p>
          </div>
          <a
            href="/connexion"
            className="w-fit rounded-md bg-brass px-5 py-3 font-semibold text-on-brass transition-colors hover:bg-brass-strong"
          >
            Ouvrir la démonstration
          </a>
        </div>
      </section>
    </div>
  );
}
