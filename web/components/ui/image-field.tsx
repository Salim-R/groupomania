'use client';

import { useEffect, useId, useState } from 'react';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Champ image avec aperçu.
 *
 * Encapsulé dans son propre composant pour deux raisons : il est réutilisé par
 * le formulaire de carnet et par celui d'étape, et surtout il est remonté avec
 * le formulaire parent lorsque la clé de celui-ci change. L'aperçu se vide donc
 * après un envoi réussi sans qu'aucun effet n'ait à appeler un setter, ce qui
 * évite l'anti-motif consistant à synchroniser un état dans un `useEffect`.
 *
 * Le contrôle de taille avant envoi épargne un transfert inutile. La limite
 * reste appliquée côté serveur, qui fait autorité : si le script ne charge pas,
 * seule la commodité disparaît.
 */
export function ImageField({
  name,
  label,
  hint,
  serverError,
}: {
  name: string;
  label: string;
  hint?: string;
  serverError?: string;
}) {
  const id = useId();
  const hintId = `${id}-indication`;
  const errorId = `${id}-erreur`;

  const [preview, setPreview] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);

  // Une URL d'objet réserve de la mémoire jusqu'à sa révocation explicite :
  // la libérer au changement d'aperçu évite une fuite sur les formulaires
  // où l'on essaie plusieurs images de suite.
  useEffect(() => {
    if (!preview) return undefined;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSizeError(null);

    if (!file) {
      setPreview(null);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setSizeError('Le fichier dépasse 5 Mo.');
      event.target.value = '';
      setPreview(null);
      return;
    }

    setPreview(URL.createObjectURL(file));
  };

  const error = sizeError ?? serverError;

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>

      {hint && (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}

      <input
        id={id}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        className="text-sm text-ink-muted file:me-3 file:rounded-md file:border file:border-rule-strong file:bg-paper-raised file:px-3 file:py-1.5 file:text-sm file:text-ink"
      />

      {error && (
        <p id={errorId} role="alert" className="text-sm text-alert">
          {error}
        </p>
      )}

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt={`Aperçu : ${label.toLowerCase()}`}
          className="mt-1 max-h-56 w-full rounded-lg border border-rule object-cover"
        />
      )}
    </div>
  );
}
