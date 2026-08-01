import { cookies } from 'next/headers';

import type { ApiErrorBody, FieldErrors } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  message?: string;
  errors?: FieldErrors;
}

/**
 * Appel de l'API depuis le serveur, avec relais du cookie de session.
 *
 * Le point délicat de l'architecture : lorsqu'une Server Action authentifie un
 * visiteur, c'est le serveur Next qui reçoit l'en-tête `Set-Cookie` de l'API,
 * pas le navigateur. Sans réémission explicite, la session serait perdue
 * aussitôt qu'obtenue.
 *
 * `getSetCookie()` est utilisé plutôt que `get('set-cookie')` : ce dernier
 * concatène les cookies multiples en une seule chaîne, ce qui rend le découpage
 * ambigu dès qu'une valeur contient une virgule (les dates d'expiration en
 * contiennent).
 */
async function forwardSessionCookie(response: Response) {
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length === 0) return;

  const store = await cookies();

  for (const raw of setCookies) {
    const [pair, ...attributes] = raw.split(';');
    const separator = pair.indexOf('=');
    if (separator === -1) continue;

    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();

    const lowered = attributes.map((a) => a.trim().toLowerCase());
    const maxAgeAttribute = lowered.find((a) => a.startsWith('max-age='));
    const maxAge = maxAgeAttribute ? Number(maxAgeAttribute.split('=')[1]) : undefined;

    store.set({
      name,
      value,
      httpOnly: lowered.includes('httponly'),
      secure: lowered.includes('secure'),
      sameSite: lowered.includes('samesite=none') ? 'none' : 'lax',
      path: '/',
      ...(maxAge !== undefined ? { maxAge } : {}),
    });
  }
}

async function sessionHeader(): Promise<Record<string, string>> {
  const store = await cookies();
  const jwt = store.get('jwt');
  return jwt ? { Cookie: `jwt=${jwt.value}` } : {};
}

/**
 * Exécute une mutation contre l'API et renvoie un résultat exploitable par
 * `useActionState`, plutôt que de lever une exception : une action serveur qui
 * échoue doit rendre un état de formulaire, pas une page d'erreur.
 */
export async function callApi<T>(
  path: string,
  init: { method: string; body?: FormData | Record<string, unknown> }
): Promise<ActionResult<T>> {
  const isFormData = init.body instanceof FormData;

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: init.method,
      headers: {
        ...(init.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...(await sessionHeader()),
      },
      body: isFormData
        ? (init.body as FormData)
        : init.body
          ? JSON.stringify(init.body)
          : undefined,
      cache: 'no-store',
    });
  } catch {
    // Message rédigé pour un visiteur, pas pour celui qui développe. L'API de
    // démonstration est hébergée sur une offre gratuite qui met le service en
    // veille : le premier appel après une période creuse échoue le temps du
    // réveil, et la seule action utile est de réessayer.
    return {
      ok: false,
      message: 'Le service ne répond pas pour le moment. Merci de réessayer dans un instant.',
    };
  }

  await forwardSessionCookie(response);

  const payload = (await response.json().catch(() => ({}))) as ApiErrorBody & T;

  if (!response.ok) {
    return {
      ok: false,
      message: payload.message ?? 'Une erreur est survenue.',
      errors: payload.errors,
    };
  }

  return { ok: true, data: payload as T };
}
