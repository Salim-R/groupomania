'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';

import { signInAction, signUpAction, type AuthFormState } from '@/app/actions/auth';
import { SubmitButton } from '@/components/ui/submit-button';
import { Field } from '@/components/ui/field';

type Mode = 'login' | 'register';

const initialState: AuthFormState = {};

/**
 * Formulaire d'authentification, partagé entre connexion et inscription.
 *
 * L'action est passée à l'attribut `action` du formulaire, pas à `onSubmit` :
 * la soumission aboutit donc même si le JavaScript n'a pas chargé ou a échoué.
 * `useActionState` n'ajoute que l'affichage progressif de l'état ; il ne
 * conditionne pas le fonctionnement.
 *
 * Les erreurs de validation renvoyées par l'API sont rattachées à leur champ
 * plutôt qu'agrégées dans un bandeau : l'utilisateur voit sous quel champ agir
 * au lieu de chercher lequel est en cause.
 */
export function AuthForm({ mode }: { mode: Mode }) {
  const isRegister = mode === 'register';
  const searchParams = useSearchParams();
  const suite = searchParams.get('suite') ?? '';

  const [state, formAction] = useActionState(
    isRegister ? signUpAction : signInAction,
    initialState
  );

  const errors = state.errors ?? {};

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {/* Transmis en champ caché pour que la redirection après connexion
          fonctionne aussi sans JavaScript. */}
      <input type="hidden" name="suite" value={suite} />

      {state.message && (
        <p
          role="alert"
          className="rounded-md border border-alert bg-alert-wash px-3 py-2 text-sm text-ink"
        >
          {state.message}
        </p>
      )}

      {isRegister && (
        <Field
          label="Nom d'atelier"
          name="pseudo"
          autoComplete="nickname"
          required
          minLength={3}
          maxLength={55}
          defaultValue={state.values?.pseudo}
          hint="Le nom affiché sur vos projets."
          error={errors.pseudo}
        />
      )}

      <Field
        label="Adresse électronique"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={errors.email}
      />

      <Field
        label="Mot de passe"
        name="password"
        type="password"
        // Indique au gestionnaire de mots de passe s'il doit proposer une
        // création ou un remplissage.
        autoComplete={isRegister ? 'new-password' : 'current-password'}
        required
        minLength={6}
        hint={isRegister ? 'Six caractères au minimum.' : undefined}
        error={errors.password}
      />

      <SubmitButton pendingLabel="Un instant…">
        {isRegister ? 'Ouvrir mon atelier' : 'Se connecter'}
      </SubmitButton>

      <p className="text-sm text-ink-muted">
        {isRegister ? (
          <>
            Vous avez déjà un atelier ?{' '}
            <Link href="/connexion" className="text-brass underline underline-offset-4">
              Se connecter
            </Link>
          </>
        ) : (
          <>
            Pas encore d&apos;atelier ?{' '}
            <Link href="/inscription" className="text-brass underline underline-offset-4">
              En ouvrir un
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
