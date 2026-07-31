'use server';

import { redirect } from 'next/navigation';

import { callApi, clearSessionCookie } from '@/lib/server/api';
import type { CurrentUser, FieldErrors } from '@/lib/types';

export interface AuthFormState {
  errors?: FieldErrors;
  message?: string;
  /** Conservé pour réafficher la saisie après un échec, sans le mot de passe. */
  values?: { pseudo?: string; email?: string };
}

const safeRedirect = (value: FormDataEntryValue | null) => {
  const path = typeof value === 'string' ? value : '';
  // Un chemin fourni par le client ne doit jamais permettre une redirection
  // vers un domaine externe : on n'accepte qu'un chemin absolu interne.
  return path.startsWith('/') && !path.startsWith('//') ? path : '/';
};

/**
 * Connexion.
 *
 * Signature imposée par `useActionState` : (étatPrécédent, formData). L'action
 * étant attachée à l'attribut `action` du formulaire, la soumission fonctionne
 * même sans JavaScript : le navigateur envoie le formulaire, le serveur répond
 * par une redirection. C'est là tout l'intérêt par rapport à un gestionnaire
 * `onSubmit`, qui ne s'exécute jamais si le script n'a pas chargé.
 */
export async function signInAction(
  _previous: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const result = await callApi<{ user: CurrentUser }>('/api/user/login', {
    method: 'POST',
    body: { email, password },
  });

  if (!result.ok) {
    return { errors: result.errors, message: result.message, values: { email } };
  }

  // `redirect` lève une exception interceptée par Next : rien ne doit être
  // écrit après, et l'appel est volontairement hors du bloc try.
  redirect(safeRedirect(formData.get('suite')));
}

export async function signUpAction(
  _previous: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const pseudo = String(formData.get('pseudo') ?? '');
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const created = await callApi<{ user: CurrentUser }>('/api/user/register', {
    method: 'POST',
    body: { pseudo, email, password },
  });

  if (!created.ok) {
    return { errors: created.errors, message: created.message, values: { pseudo, email } };
  }

  // L'inscription n'ouvre pas de session : on enchaîne la connexion pour
  // éviter de demander deux fois les mêmes identifiants.
  const signedIn = await callApi<{ user: CurrentUser }>('/api/user/login', {
    method: 'POST',
    body: { email, password },
  });

  if (!signedIn.ok) {
    return {
      message: 'Compte créé, mais la connexion a échoué. Essayez de vous connecter.',
      values: { pseudo, email },
    };
  }

  redirect(safeRedirect(formData.get('suite')));
}

export async function signOutAction() {
  await callApi('/api/user/logout', { method: 'GET' });
  await clearSessionCookie();
  redirect('/');
}
