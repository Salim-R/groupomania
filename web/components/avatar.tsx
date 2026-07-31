'use client';

import Image from 'next/image';
import { useState } from 'react';

import { mediaUrl } from '@/lib/api';

const sizes = {
  sm: { className: 'size-6', px: 24 },
  md: { className: 'size-8', px: 32 },
  lg: { className: 'size-16', px: 64 },
} as const;

/**
 * Photo de profil avec repli.
 *
 * Une image utilisateur peut toujours manquer : fichier jamais déposé, support
 * de stockage indisponible, chemin obsolète après une migration. Le repli est
 * donc géré à l'affichage plutôt qu'en supposant qu'un fichier par défaut
 * existe toujours côté serveur.
 *
 * Les dimensions sont passées en pixels réels et non en pourcentage : un avatar
 * a une taille connue, et la déclarer permet à Next de servir exactement la
 * bonne variante au lieu de la plus large. `quality` est abaissée parce qu'un
 * cercle de 32 pixels ne justifie pas 75 % de qualité JPEG.
 *
 * L'alternative textuelle est vide : le nom de l'artisan est déjà écrit à côté,
 * et le répéter ferait annoncer deux fois la même information.
 */
export function Avatar({
  picture,
  pseudo,
  size = 'md',
}: {
  picture: string | null | undefined;
  pseudo: string;
  size?: keyof typeof sizes;
}) {
  const [failed, setFailed] = useState(false);
  const url = mediaUrl(picture);
  const initial = pseudo.trim().charAt(0).toUpperCase();
  const { className, px } = sizes[size];

  if (!url || failed) {
    return (
      <span
        aria-hidden="true"
        className={`${className} flex shrink-0 items-center justify-center rounded-full border border-rule bg-paper-sunken font-display text-ink-muted`}
      >
        {initial}
      </span>
    );
  }

  return (
    <Image
      src={url}
      alt=""
      width={px}
      height={px}
      quality={60}
      className={`${className} shrink-0 rounded-full border border-rule object-cover`}
      onError={() => setFailed(true)}
    />
  );
}
