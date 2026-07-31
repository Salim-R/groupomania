import { NextResponse, type NextRequest } from 'next/server';

/**
 * Routes réservées aux ateliers connectés.
 *
 * Ce filtre est une commodité d'affichage, pas une mesure de sécurité : il
 * évite de présenter un formulaire de création à quelqu'un qui sera de toute
 * façon refusé. L'autorisation réelle est vérifiée par l'API, qui seule
 * détient le secret de signature et peut valider le jeton.
 *
 * Écrire cette distinction est important : un contrôle d'accès placé
 * uniquement côté client se contourne en désactivant JavaScript.
 *
 * Le fichier s'appelle `proxy` et non `middleware` : Next 16 a déprécié
 * l'ancienne convention.
 */
const protectedPaths = [/^\/carnets\/nouveau$/];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!protectedPaths.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // La présence du cookie suffit ici : sa validité est l'affaire de l'API.
  if (request.cookies.has('jwt')) {
    return NextResponse.next();
  }

  const login = new URL('/connexion', request.url);
  // La page demandée est mémorisée pour y revenir après authentification.
  login.searchParams.set('suite', pathname);

  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/carnets/:path*'],
};
