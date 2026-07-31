'use client';

import { useId } from 'react';

interface FieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
  multiline?: boolean;
  rows?: number;
}

/**
 * Champ de formulaire accessible.
 *
 * Quatre liaisons que l'on oublie couramment, et sans lesquelles un formulaire
 * est inutilisable au lecteur d'écran :
 *
 * - le libellé est associé au champ par `htmlFor`, pas seulement posé au-dessus ;
 * - `aria-invalid` signale l'erreur autrement que par la couleur du contour ;
 * - `aria-describedby` rattache le message d'erreur et l'indication au champ,
 *   de sorte qu'ils soient lus au moment où l'on entre dedans ;
 * - `role="alert"` fait annoncer l'erreur dès son apparition, sans attendre
 *   que l'utilisateur revienne sur le champ.
 *
 * Les identifiants viennent de `useId` : deux instances du même champ sur une
 * page ne peuvent pas entrer en collision.
 */
export function Field({
  label,
  error,
  hint,
  multiline = false,
  rows = 4,
  className = '',
  ...props
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-erreur`;
  const hintId = `${id}-indication`;

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  const shared = {
    id,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': describedBy || undefined,
    className: `w-full rounded-md border bg-paper-raised px-3 py-2 text-ink placeholder:text-ink-faint ${
      error ? 'border-alert' : 'border-rule-strong'
    } ${className}`,
  };

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

      {multiline ? (
        <textarea
          {...shared}
          rows={rows}
          {...(props as unknown as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input {...shared} {...props} />
      )}

      {error && (
        <p id={errorId} role="alert" className="text-sm text-alert">
          {error}
        </p>
      )}
    </div>
  );
}
