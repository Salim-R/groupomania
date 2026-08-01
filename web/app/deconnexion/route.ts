import { NextResponse, type NextRequest } from 'next/server';

import { callApi } from '@/lib/server/api';

/**
 * Déconnexion.
 *
 * Un gestionnaire de route plutôt qu'une Server Action, et c'est le seul
 * endroit du projet où ce choix s'impose.
 *
 * Une Server Action se termine par `redirect()`, qui produit une navigation
 * côté client : le navigateur ne recharge pas le document, il applique un
 * fragment rendu par le serveur. L'en-tête vit dans la mise en page racine, et
 * rien n'ordonne l'invalidation du cache de routeur par rapport à cette
 * navigation. La conséquence était visible : après « Se déconnecter », l'en-tête
 * affichait encore le pseudo une fois sur deux environ.
 *
 * Un 303 depuis un POST oblige le navigateur à repartir en GET sur une page
 * entière. Aucun cache client n'intervient, la mise en page est réévaluée sans
 * session, et le comportement cesse d'être une question de timing.
 *
 * La contrainte de départ est préservée : le formulaire reste un formulaire, la
 * déconnexion aboutit donc sans JavaScript.
 */
export async function POST(request: NextRequest) {
  await callApi('/api/user/logout', { method: 'GET' });

  const response = NextResponse.redirect(new URL('/', request.url), 303);

  // Le cookie est retiré sur la réponse elle-même : c'est elle que le
  // navigateur reçoit, et elle emporte donc la fin de session avec elle.
  response.cookies.delete('jwt');

  return response;
}
