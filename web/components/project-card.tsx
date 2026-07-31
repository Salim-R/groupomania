import Image from 'next/image';
import Link from 'next/link';

import { Avatar } from '@/components/avatar';
import { mediaUrl } from '@/lib/api';
import type { ProjectCard as ProjectCardType } from '@/lib/types';

const statusLabels: Record<ProjectCardType['status'], string> = {
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  ARCHIVED: 'Archivé',
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso)
  );

/**
 * Carte d'un carnet dans le fil.
 *
 * `priority` est réservé aux premières cartes : précharger toutes les images
 * d'une grille reviendrait à mettre tout le fil en concurrence pour la bande
 * passante et dégraderait le LCP au lieu de l'améliorer.
 */
export function ProjectCard({
  project,
  priority = false,
}: {
  project: ProjectCardType;
  priority?: boolean;
}) {
  const cover = mediaUrl(project.coverImage);
  const steps = project._count.steps;

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-rule bg-paper-raised shadow-card transition-colors hover:border-rule-strong">
      <Link href={`/carnets/${project.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[3/2] overflow-hidden bg-paper-sunken">
          {cover ? (
            <Image
              src={cover}
              alt=""
              fill
              // Trois colonnes au-delà de 1024 px, deux au-delà de 640 px, une
              // en dessous. Sans cette indication, Next servirait une image
              // dimensionnée pour toute la largeur de l'écran à chaque carte.
              sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
              priority={priority}
              // Nom d'élément partagé : le navigateur reconnaît cette image sur
              // la page de destination et anime la continuité entre les deux.
              // Le nom doit être unique dans la page, d'où l'identifiant.
              style={{ viewTransitionName: `couverture-${project.id}` }}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex size-full items-center justify-center font-display text-4xl text-ink-faint"
            >
              {project.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-brass-wash px-2 py-0.5 font-medium text-brass-strong">
              {statusLabels[project.status]}
            </span>
            <span className="text-ink-faint">
              {steps} {steps > 1 ? 'étapes' : 'étape'}
            </span>
          </div>

          <h2 className="font-display text-lg leading-snug font-semibold text-ink">
            {project.title}
          </h2>

          {project.summary && (
            <p className="line-clamp-2 text-sm text-ink-muted">{project.summary}</p>
          )}
        </div>
      </Link>

      <footer className="flex items-center gap-2 border-t border-rule px-4 py-3 text-sm">
        <Link
          href={`/artisans/${project.author.id}`}
          className="flex min-w-0 items-center gap-2 text-ink-muted transition-colors hover:text-ink"
        >
          <Avatar picture={project.author.picture} pseudo={project.author.pseudo} size="sm" />
          <span className="truncate">{project.author.pseudo}</span>
          {project.author.craft && (
            <span className="hidden truncate text-ink-faint sm:inline">
              · {project.author.craft}
            </span>
          )}
        </Link>

        <time dateTime={project.createdAt} className="ms-auto shrink-0 text-xs text-ink-faint">
          {formatDate(project.createdAt)}
        </time>
      </footer>
    </article>
  );
}
