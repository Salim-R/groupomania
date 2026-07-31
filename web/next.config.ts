import type { NextConfig } from 'next';

/**
 * Les images déposées par les ateliers sont servies par l'API, sur une autre
 * origine que le client. Next refuse par défaut d'optimiser une image distante
 * non déclarée, pour éviter qu'un site tiers ne se serve du redimensionneur
 * comme d'un proxy gratuit.
 *
 * Le motif est dérivé de `NEXT_PUBLIC_API_URL` plutôt qu'écrit en dur : la même
 * configuration vaut en local et en production, sans branche conditionnelle à
 * maintenir.
 */
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000');

const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: apiUrl.hostname,
        ...(apiUrl.port ? { port: apiUrl.port } : {}),
        pathname: '/uploads/**',
      },
    ],

    // AVIF avant WebP : environ vingt pour cent plus léger à qualité égale.
    // Next retombe sur le format suivant selon l'en-tête Accept du navigateur.
    formats: ['image/avif', 'image/webp'],

    // Next 16 exige de déclarer les niveaux de qualité utilisés, afin qu'une
    // valeur arbitraire passée dans une URL ne puisse pas multiplier les
    // variantes à générer et à mettre en cache. 60 sert aux avatars, où la
    // différence est invisible à 32 pixels.
    qualities: [60, 75],

    /**
     * Next 16 refuse d'optimiser une image dont l'hôte résout vers une adresse
     * privée : c'est une protection contre le SSRF, l'optimiseur pouvant sinon
     * servir de relais vers le réseau interne.
     *
     * En développement, l'API est sur localhost et tombe précisément dans ce
     * cas. L'exception est donc conditionnée à l'environnement : en production,
     * l'API est joignable sur un domaine public et la protection reste active.
     */
    ...(isDevelopment ? { dangerouslyAllowLocalIP: true } : {}),
  },

  // Retire la signature par défaut, qui n'apporte rien et expose la version
  // utilisée.
  poweredByHeader: false,

  experimental: {
    // Transitions de vue natives entre navigations.
    viewTransition: true,
  },
};

export default nextConfig;
