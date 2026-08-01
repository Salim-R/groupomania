import { api } from './api';
import type { CurrentUser, Page, ProjectCard, ProjectDetail, UserProfile } from './types';

/**
 * Lectures de l'API, regroupées par ressource.
 *
 * Ce module ne couvre que les lectures, et c'est délibéré. Les deux familles
 * d'appels n'ont pas le même contrat d'erreur :
 *
 *  - une lecture est faite par un composant serveur pendant le rendu. Elle lève
 *    une `ApiError`, que la page traduit en `notFound()` ou laisse remonter à la
 *    frontière d'erreur. C'est ce que fait ce module.
 *  - une écriture est faite par une Server Action attachée à un formulaire. Elle
 *    ne doit rien lever : un envoi refusé se raconte dans l'état du formulaire,
 *    sous le champ fautif, pas par une page d'erreur. Elle passe donc par
 *    `lib/server/api.ts`, qui renvoie un résultat au lieu de jeter.
 *
 * Les envelopper toutes ici imposerait à chaque appelant de rattraper une
 * exception pour la reconvertir en état de formulaire, ce qui reviendrait à
 * écrire deux fois la même conversion.
 */

export const auth = {
  me: () => api.get<CurrentUser>('/api/user/me'),
};

export const projects = {
  list: (
    params: {
      limit?: number;
      cursor?: string;
      craft?: string;
      city?: string;
      author?: string;
    } = {}
  ) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') query.set(key, String(value));
    }
    const suffix = query.toString();
    return api.get<Page<ProjectCard>>(`/api/project${suffix ? `?${suffix}` : ''}`);
  },

  one: (id: string) => api.get<ProjectDetail>(`/api/project/${id}`),
};

export const users = {
  list: (params: { craft?: string; city?: string } = {}) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
    const suffix = query.toString();
    return api.get<CurrentUser[]>(`/api/user${suffix ? `?${suffix}` : ''}`);
  },

  profile: (id: string) => api.get<UserProfile>(`/api/user/${id}`),
};
