import { api } from './api';
import type {
  Comment,
  CurrentUser,
  LikeState,
  Page,
  ProjectCard,
  ProjectDetail,
  Step,
  UserProfile,
} from './types';

/**
 * Accès à l'API, regroupés par ressource.
 *
 * Les composants n'écrivent jamais de chemin en dur : une route qui change se
 * corrige ici seulement, et le typage garantit que l'appelant reçoit ce qu'il
 * attend.
 */

export const auth = {
  register: (body: { pseudo: string; email: string; password: string }) =>
    api.post<{ user: CurrentUser }>('/api/user/register', body),

  login: (body: { email: string; password: string }) =>
    api.post<{ user: CurrentUser }>('/api/user/login', body),

  logout: () => api.get<{ message: string }>('/api/user/logout'),

  me: () => api.get<CurrentUser>('/api/user/me'),
};

export const projects = {
  list: (params: { limit?: number; cursor?: string; craft?: string; city?: string; author?: string } = {}) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') query.set(key, String(value));
    }
    const suffix = query.toString();
    return api.get<Page<ProjectCard>>(`/api/project${suffix ? `?${suffix}` : ''}`);
  },

  one: (id: string) => api.get<ProjectDetail>(`/api/project/${id}`),

  create: (body: FormData | { title: string; summary?: string }) =>
    api.post<ProjectCard>('/api/project', body),

  update: (id: string, body: { title?: string; summary?: string; status?: string }) =>
    api.put<ProjectCard>(`/api/project/${id}`, body),

  remove: (id: string) => api.delete<{ message: string }>(`/api/project/${id}`),

  like: (id: string) => api.put<LikeState>(`/api/project/${id}/like`),

  unlike: (id: string) => api.delete<LikeState>(`/api/project/${id}/like`),
};

export const steps = {
  add: (projectId: string, body: FormData | { title: string; body?: string }) =>
    api.post<Step>(`/api/project/${projectId}/steps`, body),

  update: (projectId: string, stepId: string, body: FormData | { title: string; body?: string }) =>
    api.put<Step>(`/api/project/${projectId}/steps/${stepId}`, body),

  remove: (projectId: string, stepId: string) =>
    api.delete<{ message: string }>(`/api/project/${projectId}/steps/${stepId}`),

  /** Renvoie la liste complète réordonnée, pas seulement l'étape déplacée. */
  move: (projectId: string, stepId: string, position: number) =>
    api.patch<Step[]>(`/api/project/${projectId}/steps/${stepId}/position`, { position }),
};

export const comments = {
  add: (projectId: string, text: string) =>
    api.post<Comment>(`/api/project/${projectId}/comments`, { text }),

  update: (projectId: string, commentId: string, text: string) =>
    api.put<Comment>(`/api/project/${projectId}/comments/${commentId}`, { text }),

  remove: (projectId: string, commentId: string) =>
    api.delete<{ message: string }>(`/api/project/${projectId}/comments/${commentId}`),
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

  update: (id: string, body: { bio?: string; craft?: string | null; city?: string | null }) =>
    api.put<CurrentUser>(`/api/user/${id}`, body),

  follow: (id: string) => api.put<UserProfile>(`/api/user/${id}/follow`),

  unfollow: (id: string) => api.delete<UserProfile>(`/api/user/${id}/follow`),

  picture: (file: FormData) => api.post<CurrentUser>('/api/user/me/picture', file),
};
