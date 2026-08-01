'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Avatar } from '@/components/avatar';
import { useSession } from '@/components/session-provider';

const links = [
  { href: '/', label: 'Les carnets' },
  { href: '/artisans', label: 'Les artisans' },
];

export function SiteHeader() {
  const { user, isAuthenticated } = useSession();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-rule bg-paper-raised/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight text-ink">
          L&apos;Établi
        </Link>

        <nav aria-label="Navigation principale" className="flex items-center gap-4 text-sm">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                // aria-current annonce la page courante aux lecteurs d'écran :
                // la couleur seule ne transmet aucune information.
                aria-current={active ? 'page' : undefined}
                className={
                  active
                    ? 'font-medium text-brass underline underline-offset-4'
                    : 'text-ink-muted transition-colors hover:text-ink'
                }
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-3 text-sm">
          {isAuthenticated && user ? (
            <>
              <Link
                href="/carnets/nouveau"
                className="rounded-md bg-brass px-3 py-1.5 font-medium text-on-brass transition-colors hover:bg-brass-strong"
              >
                Ouvrir un carnet
              </Link>

              <Link
                href={`/artisans/${user.id}`}
                className="flex items-center gap-2 text-ink-muted transition-colors hover:text-ink"
              >
                <Avatar picture={user.picture} pseudo={user.pseudo} size="md" />
                <span>{user.pseudo}</span>
              </Link>

              {/* Un formulaire plutôt qu'un bouton avec gestionnaire de clic :
                  la déconnexion aboutit même sans JavaScript. Il vise un
                  gestionnaire de route, qui répond une redirection HTTP : le
                  document est rechargé entièrement, et l'en-tête ne peut donc
                  pas rester sur la session précédente. Voir app/deconnexion. */}
              <form action="/deconnexion" method="post">
                <button
                  type="submit"
                  className="text-ink-muted transition-colors hover:text-ink"
                >
                  Se déconnecter
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/connexion" className="text-ink-muted transition-colors hover:text-ink">
                Se connecter
              </Link>
              <Link
                href="/inscription"
                className="rounded-md bg-brass px-3 py-1.5 font-medium text-on-brass transition-colors hover:bg-brass-strong"
              >
                Rejoindre
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
