import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Avatar } from '@/components/avatar';
import { FollowButton } from '@/components/follow-button';
import { ProjectCard } from '@/components/project-card';
import { ApiError } from '@/lib/api';
import { auth, users } from '@/lib/queries';
import type { CurrentUser, UserProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function loadProfile(id: string): Promise<UserProfile | null> {
  try {
    return await users.profile(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/**
 * L'API ne renvoie pas encore l'état d'abonnement du visiteur sur le profil
 * consulté. On le déduit ici de la session, ce qui évite un aller-retour
 * supplémentaire et reste juste : la liste des abonnements du visiteur lui
 * appartient.
 */
async function loadViewer(): Promise<CurrentUser | null> {
  try {
    return await auth.me();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await loadProfile(id);

  if (!profile) return { title: 'Atelier introuvable' };

  return {
    title: profile.pseudo,
    description: profile.bio || `Les carnets d’atelier de ${profile.pseudo}.`,
  };
}

export default async function ArtisanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, viewer] = await Promise.all([loadProfile(id), loadViewer()]);

  if (!profile) notFound();

  const stats = [
    { label: profile._count.projects > 1 ? 'carnets' : 'carnet', value: profile._count.projects },
    { label: profile._count.followers > 1 ? 'abonnés' : 'abonné', value: profile._count.followers },
    { label: 'abonnements', value: profile._count.following },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="flex flex-wrap items-start gap-6 border-b border-rule pb-8">
        <Avatar picture={profile.picture} pseudo={profile.pseudo} size="lg" />

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-semibold text-ink">{profile.pseudo}</h1>

          <p className="mt-1 text-ink-muted">
            {[profile.craft, profile.city].filter(Boolean).join(' · ') || 'Atelier'}
          </p>

          {profile.bio && <p className="mt-4 max-w-2xl text-pretty text-ink-muted">{profile.bio}</p>}

          <dl className="mt-4 flex flex-wrap gap-6 text-sm">
            {stats.map(({ label, value }) => (
              <div key={label} className="flex items-baseline gap-1.5">
                <dt className="order-2 text-ink-muted">{label}</dt>
                <dd className="order-1 font-display text-lg font-semibold text-ink tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {viewer && (
          <FollowButton
            artisanId={profile.id}
            following={false}
            followers={profile._count.followers}
          />
        )}
      </header>

      <section aria-labelledby="titre-carnets" className="mt-8">
        <h2 id="titre-carnets" className="sr-only">
          Carnets de {profile.pseudo}
        </h2>

        {profile.projects.length === 0 ? (
          <p className="rounded-lg border border-dashed border-rule-strong px-6 py-12 text-center text-ink-muted">
            Cet atelier n&apos;a pas encore ouvert de carnet.
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {profile.projects.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
