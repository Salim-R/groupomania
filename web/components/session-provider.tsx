'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';

import type { CurrentUser } from '@/lib/types';

interface SessionValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  /** Vrai si l'identifiant fourni est celui de l'utilisateur connecté. */
  isMe: (id: string | undefined) => boolean;
}

const SessionContext = createContext<SessionValue | null>(null);

/**
 * Session en lecture seule, résolue sur le serveur.
 *
 * Le contexte n'expose plus de `setUser` : depuis le passage aux Server
 * Actions, connexion et déconnexion se terminent par une redirection, et le
 * serveur recalcule la session au rendu suivant. Conserver une copie
 * modifiable côté client aurait créé deux sources de vérité, dont l'une peut
 * mentir après un retour arrière du navigateur.
 */
export function SessionProvider({
  user,
  children,
}: {
  user: CurrentUser | null;
  children: React.ReactNode;
}) {
  const isMe = useCallback((id: string | undefined) => Boolean(id && user?.id === id), [user]);

  const value = useMemo(() => ({ user, isAuthenticated: user !== null, isMe }), [user, isMe]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession doit être utilisé à l'intérieur de SessionProvider.");
  }

  return context;
}
