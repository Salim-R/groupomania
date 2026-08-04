import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';

import { SiteHeader } from '@/components/site-header';
import { SessionProvider } from '@/components/session-provider';
import { auth } from '@/lib/queries';
import type { CurrentUser } from '@/lib/types';

import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
  axes: ['SOFT', 'WONK'],
});

export const metadata: Metadata = {
  title: {
    default: "L'Établi · Carnets d’atelier",
    template: "%s · L'Établi",
  },
  description:
    "L'Établi permet aux artisans de documenter leurs ouvrages étape par étape et de partager leur savoir-faire depuis une page claire.",
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: "L'Établi",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf7f2' },
    { media: '(prefers-color-scheme: dark)', color: '#17130f' },
  ],
};

/**
 * La session est résolue sur le serveur : le premier rendu contient déjà le
 * bon en-tête, sans le clignotement « déconnecté puis connecté » d'un appel
 * effectué après l'hydratation.
 */
async function getSession(): Promise<CurrentUser | null> {
  try {
    return await auth.me();
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  return (
    <html lang="fr" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <SessionProvider user={user}>
          <a className="skip-link" href="#contenu">
            Aller au contenu
          </a>
          <SiteHeader />
          <main id="contenu" className="flex-1">
            {children}
          </main>
          <footer className="border-t border-rule px-4 py-8 text-sm text-ink-muted">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
              <p>
                <span className="font-display font-semibold text-ink">L&apos;Établi</span> · carnets d’atelier
                documentés étape par étape
              </p>
              <p>Projet de démonstration, contenus fictifs.</p>
            </div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
