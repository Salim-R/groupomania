/**
 * Types du domaine, alignés sur les projections déclarées dans
 * `Backend/lib/selectors.js`.
 *
 * Ils décrivent ce que l'API renvoie réellement, et non le schéma complet :
 * un mot de passe n'apparaît nulle part parce qu'aucune route ne l'expose.
 */

export type ProjectStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

export interface AuthorPreview {
  id: string;
  pseudo: string;
  /** Nul tant qu'aucune photo n'a été déposée : le repli relève de l'interface. */
  picture: string | null;
  craft: string | null;
}

export interface CurrentUser extends AuthorPreview {
  bio: string;
  city: string | null;
  createdAt: string;
  isAdmin?: boolean;
}

export interface Step {
  id: string;
  position: number;
  title: string;
  body: string;
  image: string | null;
  createdAt: string;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: AuthorPreview;
}

export interface ProjectCard {
  id: string;
  title: string;
  summary: string;
  coverImage: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  author: AuthorPreview;
  _count: { likes: number; comments: number; steps: number };
}

export interface ProjectDetail extends ProjectCard {
  steps: Step[];
  comments: Comment[];
  likedByMe: boolean;
}

export interface UserProfile extends CurrentUser {
  _count: { projects: number; followers: number; following: number };
  projects: ProjectCard[];
}

/** Réponse paginée par curseur du fil des carnets. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface LikeState {
  projectId: string;
  likes: number;
  likedByMe: boolean;
}

/**
 * Erreurs de validation renvoyées par l'API : une entrée par champ fautif.
 * La forme est produite par `Backend/lib/validation.js`.
 */
export type FieldErrors = Record<string, string>;

export interface ApiErrorBody {
  message?: string;
  errors?: FieldErrors;
}
