'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { callApi } from '@/lib/server/api';
import type { Comment, FieldErrors, ProjectCard, Step } from '@/lib/types';

export interface FormState {
  errors?: FieldErrors;
  message?: string;
  /** Renseigné en cas de succès, pour réinitialiser le formulaire côté client. */
  success?: boolean;
}

/** Retire un champ fichier vide : un input non renseigné est transmis comme un fichier de taille nulle. */
const stripEmptyFile = (formData: FormData, field: string) => {
  const value = formData.get(field);
  if (value instanceof File && value.size === 0) formData.delete(field);
};

export async function createProjectAction(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  stripEmptyFile(formData, 'cover');

  const result = await callApi<ProjectCard>('/api/project', {
    method: 'POST',
    body: formData,
  });

  if (!result.ok || !result.data) {
    return { errors: result.errors, message: result.message };
  }

  // Le fil et le profil de l'atelier affichent tous deux ce carnet : les deux
  // doivent être réévalués, sinon le nouveau carnet n'apparaît qu'après un
  // rechargement complet.
  revalidatePath('/');
  redirect(`/carnets/${result.data.id}`);
}

export async function addStepAction(
  projectId: string,
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  stripEmptyFile(formData, 'image');

  const result = await callApi<Step>(`/api/project/${projectId}/steps`, {
    method: 'POST',
    body: formData,
  });

  if (!result.ok) {
    return { errors: result.errors, message: result.message };
  }

  revalidatePath(`/carnets/${projectId}`);
  return { success: true };
}

export async function moveStepAction(projectId: string, stepId: string, position: number) {
  const result = await callApi<Step[]>(`/api/project/${projectId}/steps/${stepId}/position`, {
    method: 'PATCH',
    body: { position },
  });

  if (result.ok) revalidatePath(`/carnets/${projectId}`);

  return result;
}

export async function deleteStepAction(projectId: string, stepId: string) {
  const result = await callApi(`/api/project/${projectId}/steps/${stepId}`, { method: 'DELETE' });

  if (result.ok) revalidatePath(`/carnets/${projectId}`);

  return result;
}

export async function addCommentAction(
  projectId: string,
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const text = String(formData.get('text') ?? '');

  const result = await callApi<Comment>(`/api/project/${projectId}/comments`, {
    method: 'POST',
    body: { text },
  });

  if (!result.ok) {
    return { errors: result.errors, message: result.message };
  }

  revalidatePath(`/carnets/${projectId}`);
  return { success: true };
}

export async function deleteCommentAction(projectId: string, commentId: string) {
  const result = await callApi(`/api/project/${projectId}/comments/${commentId}`, {
    method: 'DELETE',
  });

  if (result.ok) revalidatePath(`/carnets/${projectId}`);

  return result;
}

export async function toggleLikeAction(projectId: string, liked: boolean) {
  const result = await callApi<{ likes: number; likedByMe: boolean }>(
    `/api/project/${projectId}/like`,
    { method: liked ? 'PUT' : 'DELETE' }
  );

  if (result.ok) revalidatePath(`/carnets/${projectId}`);

  return result;
}

export async function toggleFollowAction(artisanId: string, following: boolean) {
  const result = await callApi(`/api/user/${artisanId}/follow`, {
    method: following ? 'PUT' : 'DELETE',
  });

  if (result.ok) revalidatePath(`/artisans/${artisanId}`);

  return result;
}
