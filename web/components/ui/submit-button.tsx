'use client';

import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';

/**
 * Bouton de soumission qui lit l'état du formulaire parent.
 *
 * `useFormStatus` doit être appelé dans un composant *enfant* du formulaire :
 * c'est cette contrainte qui justifie un composant dédié plutôt qu'un état
 * local dans le formulaire. L'avantage est qu'aucun `useState` n'est nécessaire
 * et que l'état reste juste même quand plusieurs soumissions s'enchaînent.
 */
export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: React.ComponentProps<typeof Button> & { pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} aria-busy={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
