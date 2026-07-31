import type { ApiErrorBody, FieldErrors } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

/**
 * Erreur d'API transportant le statut et les erreurs par champ.
 *
 * Les composants distinguent ainsi une saisie invalide (400, à afficher sous
 * le champ concerné) d'une session expirée (401, à rediriger) ou d'une panne
 * (500, message générique), au lieu de traiter tous les échecs pareillement.
 */
export class ApiError extends Error {
  readonly status: number;

  readonly fieldErrors: FieldErrors;

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Durée de mise en cache côté serveur, en secondes. 0 désactive le cache. */
  revalidate?: number;
}

/**
 * Sur le serveur, le cookie de session n'est pas joint automatiquement :
 * il faut le lire dans la requête entrante et le retransmettre. Sur le
 * navigateur, `credentials: 'include'` suffit.
 *
 * `next/headers` est importé dynamiquement pour que ce module reste utilisable
 * dans un composant client, où l'import statique échouerait à la compilation.
 */
async function serverCookieHeader(): Promise<Record<string, string>> {
  if (typeof window !== 'undefined') return {};

  const { cookies } = await import('next/headers');
  const store = await cookies();
  const jwt = store.get('jwt');

  return jwt ? { Cookie: `jwt=${jwt.value}` } : {};
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, revalidate, headers, ...rest } = options;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(await serverCookieHeader()),
      ...headers,
    },
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    // Les données d'un carnet changent à chaque étape publiée : pas de cache
    // par défaut, et une durée explicite là où elle se justifie.
    ...(revalidate === undefined ? { cache: 'no-store' as const } : { next: { revalidate } }),
  });

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => ({}))) as ApiErrorBody & T;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload.message ?? 'Une erreur est survenue.',
      payload.errors ?? {}
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
};

/** Résout le chemin d'une image déposée en URL absolue servie par l'API. */
export const mediaUrl = (path: string | null | undefined) =>
  path ? `${API_URL}/${path.replace(/^\/+/, '')}` : null;
