import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Avatar } from '@/components/avatar';
import { CommentSection } from '@/components/comment-section';
import { LikeButton } from '@/components/like-button';
import { StepEditor } from '@/components/step-editor';
import { ApiError, mediaUrl } from '@/lib/api';
import { projects } from '@/lib/queries';
import type { ProjectDetail } from '@/lib/types';

export const dynamic = 'force-dynamic';

const statusLabels: Record<ProjectDetail['status'], string> = {
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  ARCHIVED: 'Archivé',
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(iso));

async function loadProject(id: string): Promise<ProjectDetail | null> {
  try {
    return await projects.one(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await loadProject(id);

  if (!project) return { title: 'Carnet introuvable' };

  return {
    title: project.title,
    description: project.summary || `Carnet d’atelier de ${project.author.pseudo}.`,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await loadProject(id);

  if (!project) notFound();

  const cover = mediaUrl(project.coverImage);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <header>
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-brass-wash px-2.5 py-0.5 font-medium text-brass-strong">
            {statusLabels[project.status]}
          </span>
          <time dateTime={project.createdAt} className="text-ink-faint">
            Ouvert le {formatDate(project.createdAt)}
          </time>
        </p>

        <h1 className="mt-3 font-display text-4xl leading-tight font-semibold text-balance text-ink">
          {project.title}
        </h1>

        {project.summary && (
          <p className="mt-3 text-lg text-pretty text-ink-muted">{project.summary}</p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-rule py-4">
          <Link
            href={`/artisans/${project.author.id}`}
            className="flex items-center gap-3 text-ink hover:underline"
          >
            <Avatar picture={project.author.picture} pseudo={project.author.pseudo} size="md" />
            <span>
              <span className="block font-medium">{project.author.pseudo}</span>
              {project.author.craft && (
                <span className="block text-sm text-ink-muted">{project.author.craft}</span>
              )}
            </span>
          </Link>

          <div className="ms-auto">
            <LikeButton
              projectId={project.id}
              count={project._count.likes}
              liked={project.likedByMe}
            />
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-3 overflow-hidden rounded-xl border border-rule bg-paper-raised text-center shadow-card">
          <div className="p-4">
            <dt className="text-xs text-ink-faint">Étapes</dt>
            <dd className="mt-1 font-display text-2xl font-semibold text-ink">{project.steps.length}</dd>
          </div>
          <div className="border-x border-rule p-4">
            <dt className="text-xs text-ink-faint">Échanges</dt>
            <dd className="mt-1 font-display text-2xl font-semibold text-ink">{project.comments.length}</dd>
          </div>
          <div className="p-4">
            <dt className="text-xs text-ink-faint">Appréciations</dt>
            <dd className="mt-1 font-display text-2xl font-semibold text-ink">{project._count.likes}</dd>
          </div>
        </dl>
      </header>

      {cover && (
        // Rapport de forme imposé et rognage assumé : les dimensions réelles
        // des images déposées ne sont pas connues du serveur, et Next exige un
        // rapport pour réserver la place avant chargement. Sans réservation,
        // l'arrivée de l'image décalerait tout le contenu situé en dessous.
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg border border-rule">
          <Image
            src={cover}
            alt=""
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            priority
            // Même nom que la vignette du fil : le navigateur relie les deux
            // et anime le passage de l'une à l'autre pendant la navigation.
            style={{ viewTransitionName: `couverture-${project.id}` }}
            className="object-cover"
          />
        </div>
      )}

      <section aria-labelledby="titre-etapes" className="mt-12">
        <h2 id="titre-etapes" className="font-display text-2xl font-semibold text-ink">
          L&apos;avancement du carnet
        </h2>
        <p className="mt-2 text-ink-muted">Chaque étape conserve les choix, les gestes et les images de fabrication.</p>

        {project.steps.length === 0 ? (
          <p className="mt-4 text-ink-muted">
            Ce carnet n&apos;a pas encore d&apos;étape. L&apos;atelier vient de l&apos;ouvrir.
          </p>
        ) : (
          // Une liste ordonnée : l'ordre porte du sens, ce n'est pas une simple
          // succession de blocs. Un lecteur d'écran annonce « 2 sur 5 ».
          <ol className="relative mt-8 flex flex-col gap-10 before:absolute before:top-3 before:bottom-3 before:left-3.5 before:w-px before:bg-rule-strong">
            {project.steps.map((step) => {
              const image = mediaUrl(step.image);

              return (
                <li key={step.id} className="relative ps-12">
                  <span
                    aria-hidden="true"
                    className="absolute start-0 top-0 z-1 flex size-7 items-center justify-center rounded-full border border-brass bg-paper-raised font-display text-sm font-semibold text-brass-strong"
                  >
                    {step.position}
                  </span>

                  <h3 className="font-display text-xl font-semibold text-ink">{step.title}</h3>

                  {step.body && (
                    <p className="mt-2 whitespace-pre-line text-pretty text-ink-muted">
                      {step.body}
                    </p>
                  )}

                  {/* `alt` vide, faute de mieux. Contrairement aux avatars, cette
                      photo porte une information que le titre de l'étape ne
                      restitue pas : elle mériterait une description. Mais aucun
                      texte alternatif n'est demandé au dépôt, et en fabriquer un
                      à partir du titre reviendrait à répéter la ligne du dessus.
                      La correction est un champ `alt` sur Step, pas une rustine
                      ici. Limite écrite dans le README. */}
                  {image && (
                    <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-lg border border-rule">
                      <Image
                        src={image}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 720px, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <StepEditor projectId={project.id} authorId={project.author.id} steps={project.steps} />

      <CommentSection
        projectId={project.id}
        projectAuthorId={project.author.id}
        comments={project.comments}
      />
    </article>
  );
}
