import { CommentsSkeleton, StepListSkeleton } from '@/components/skeletons';

const shimmer = 'animate-pulse bg-paper-sunken';

export default function Loading() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <div aria-hidden="true">
        <div className={`h-5 w-48 rounded ${shimmer}`} />
        <div className={`mt-4 h-10 w-4/5 rounded ${shimmer}`} />
        <div className={`mt-3 h-6 w-full rounded ${shimmer}`} />

        <div className="mt-6 flex items-center gap-3 border-y border-rule py-4">
          <div className={`size-8 rounded-full ${shimmer}`} />
          <div className={`h-5 w-40 rounded ${shimmer}`} />
          <div className={`ms-auto h-9 w-52 rounded-md ${shimmer}`} />
        </div>

        {/* Même rapport de forme que l'image de couverture réelle : la place
            est réservée, l'arrivée du visuel ne décale rien. */}
        <div className={`mt-8 aspect-[16/9] w-full rounded-lg ${shimmer}`} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink">Le déroulé</h2>
        <StepListSkeleton />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-ink">Échanges</h2>
        <CommentsSkeleton />
      </section>
    </article>
  );
}
