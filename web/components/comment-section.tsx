'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useTransition } from 'react';

import { addCommentAction, deleteCommentAction, type FormState } from '@/app/actions/projects';
import { Avatar } from '@/components/avatar';
import { useSession } from '@/components/session-provider';
import { Field } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import type { Comment } from '@/lib/types';

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));

const initialState: FormState = {};

export function CommentSection({
  projectId,
  projectAuthorId,
  comments,
}: {
  projectId: string;
  projectAuthorId: string;
  comments: Comment[];
}) {
  const { isAuthenticated, isMe } = useSession();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const action = addCommentAction.bind(null, projectId);
  const [state, formAction] = useActionState(action, initialState);

  /**
   * La clé du formulaire dérive du nombre d'échanges, donc de la donnée
   * serveur. Après une publication réussie, `revalidatePath` a réévalué la
   * page, le nombre change, React remonte le formulaire et le champ se vide de
   * lui-même. Aucun effet de synchronisation ni appel à `reset()` n'est requis,
   * et la liste affichée n'est jamais une copie locale susceptible de diverger.
   */
  const formKey = `echange-${comments.length}`;

  const canDelete = (comment: Comment) => isMe(comment.author.id) || isMe(projectAuthorId);

  const remove = (commentId: string) => {
    startTransition(async () => {
      await deleteCommentAction(projectId, commentId);

      // `revalidatePath` invalide le cache de la route ; encore faut-il que le
      // routeur redemande la page. Une soumission de formulaire le fait d'elle-
      // même, un appel d'action déclenché à la main non : sans ce rafraîchis-
      // sement, le commentaire supprimé resterait affiché jusqu'à la prochaine
      // navigation.
      router.refresh();
    });
  };

  return (
    <section aria-labelledby="titre-echanges" className="mt-12">
      <h2 id="titre-echanges" className="font-display text-2xl font-semibold text-ink">
        Échanges
        <span className="ms-2 text-base font-normal text-ink-faint">({comments.length})</span>
      </h2>

      {comments.length === 0 && (
        <p className="mt-4 text-ink-muted">Aucun échange pour l&apos;instant.</p>
      )}

      <ul className="mt-6 flex flex-col gap-5">
        {comments.map((comment) => (
          <li key={comment.id} className="flex gap-3">
            <Avatar picture={comment.author.picture} pseudo={comment.author.pseudo} size="md" />

            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <Link
                  href={`/artisans/${comment.author.id}`}
                  className="font-medium text-ink hover:underline"
                >
                  {comment.author.pseudo}
                </Link>
                <time dateTime={comment.createdAt} className="text-xs text-ink-faint">
                  {formatDate(comment.createdAt)}
                </time>
              </p>

              <p className="mt-1 text-pretty text-ink-muted">{comment.text}</p>

              {canDelete(comment) && (
                <button
                  type="button"
                  onClick={() => remove(comment.id)}
                  disabled={pending}
                  className="mt-1 text-xs text-ink-faint underline underline-offset-2 transition-colors hover:text-alert disabled:opacity-50"
                >
                  Supprimer
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {isAuthenticated ? (
        <form
          key={formKey}
          action={formAction}
          noValidate
          className="mt-8 flex flex-col gap-3"
        >
          <Field
            label="Votre retour"
            multiline
            rows={3}
            name="text"
            maxLength={500}
            required
            error={state.errors?.text ?? state.message}
          />
          <SubmitButton pendingLabel="Envoi…" className="self-start">
            Publier
          </SubmitButton>
        </form>
      ) : (
        <p className="mt-8 rounded-md border border-rule bg-paper-sunken px-4 py-3 text-sm text-ink-muted">
          <Link href="/connexion" className="text-brass underline underline-offset-4">
            Connectez-vous
          </Link>{' '}
          pour laisser un retour à l&apos;atelier.
        </p>
      )}
    </section>
  );
}
