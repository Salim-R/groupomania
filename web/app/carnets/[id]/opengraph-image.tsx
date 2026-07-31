import { ImageResponse } from 'next/og';

import { projects } from '@/lib/queries';

export const alt = "Carnet d'atelier sur L'Établi";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const statusLabels = {
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  ARCHIVED: 'Archivé',
} as const;

/**
 * Image de partage générée à la volée.
 *
 * Une capture statique unique pour tout le site donnerait la même vignette à
 * dix-sept carnets : le lien partagé ne dirait rien de son contenu. Ici, chaque
 * carnet a sa vignette, composée depuis ses propres données.
 *
 * Le rendu passe par Satori, qui n'implémente qu'un sous-ensemble de CSS :
 * flexbox uniquement, pas de grille, pas de propriétés raccourcies ambiguës, et
 * `display: flex` obligatoire sur tout conteneur à plusieurs enfants. Les
 * styles sont donc écrits en ligne et volontairement élémentaires.
 */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let project;
  try {
    project = await projects.one(id);
  } catch {
    project = null;
  }

  const title = project?.title ?? "Carnet d'atelier";
  const author = project?.author.pseudo ?? "L'Établi";
  const craft = project?.author.craft ?? null;
  const status = project ? statusLabels[project.status] : null;
  const steps = project?._count.steps ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          backgroundColor: '#faf7f2',
          // Fine trame oblique : évite l'aplat parfaitement uni, qui trahit
          // immédiatement une image générée.
          backgroundImage:
            'linear-gradient(135deg, rgba(180,112,58,0.10) 0%, rgba(250,247,242,0) 55%)',
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '14px',
              height: '48px',
              backgroundColor: '#b4703a',
              marginRight: '20px',
            }}
          />
          <div style={{ fontSize: '34px', color: '#241c15', letterSpacing: '-0.5px' }}>
            L&apos;Établi
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {status && (
            <div style={{ display: 'flex', marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  fontSize: '24px',
                  color: '#92582b',
                  backgroundColor: '#f6ece1',
                  padding: '8px 20px',
                  borderRadius: '999px',
                }}
              >
                {status}
                {steps > 0 ? ` · ${steps} ${steps > 1 ? 'étapes' : 'étape'}` : ''}
              </div>
            </div>
          )}

          <div
            style={{
              fontSize: title.length > 46 ? '58px' : '72px',
              color: '#241c15',
              lineHeight: 1.12,
              // Satori n'implémente pas le rognage multiligne : la coupe est
              // faite en amont, sur la donnée.
              display: 'flex',
            }}
          >
            {title.length > 90 ? `${title.slice(0, 90)}…` : title}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            borderTop: '2px solid #e3dbcf',
            paddingTop: '28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '999px',
              backgroundColor: '#e3dbcf',
              color: '#6b5f54',
              fontSize: '30px',
              marginRight: '20px',
            }}
          >
            {author.charAt(0).toUpperCase()}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '32px', color: '#241c15' }}>{author}</div>
            {craft && <div style={{ fontSize: '26px', color: '#6b5f54' }}>{craft}</div>}
          </div>
        </div>
      </div>
    ),
    size
  );
}
