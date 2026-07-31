/* eslint-disable no-console */
const prisma = require('../lib/prisma');
const { generateImage } = require('../scripts/demo-images');

/**
 * Jeu de données de démonstration.
 *
 * Contenus entièrement fictifs : aucun atelier réel n'est représenté, les noms
 * sont inventés. Les comptes partagent un mot de passe connu pour permettre
 * l'exploration.
 *
 * Les dates sont réparties sur trois mois : un fil dont tous les carnets
 * portent la même date ne permet pas de juger du tri, de la pagination ni de
 * la mise en forme des dates relatives.
 */
const PASSWORD = 'atelier2026';

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);

const artisans = [
  {
    pseudo: 'Margaux Ferrand',
    palette: 'bois',
    email: 'margaux@exemple.fr',
    craft: 'Ébénisterie',
    city: 'Sartrouville',
    bio: "Meubles sur mesure en bois massif. Je documente chaque commande, du choix de la planche à la dernière couche d'huile.",
    projects: [
      {
        title: 'Table de ferme en chêne',
        summary: "Plateau d'un seul tenant, piètement chevillé, finition à l'huile dure.",
        status: 'IN_PROGRESS',
        createdAt: daysAgo(6),
        steps: [
          {
            title: 'Choix des planches',
            body: "Chêne de pays séché quatre ans. Trois planches retenues sur onze, pour le fil et l'absence de nœuds traversants. Le reste partira en petites pièces.",
          },
          {
            title: 'Corroyage',
            body: 'Dégauchissage puis rabotage. Le plateau perd huit millimètres, ce qui est normal sur du massif de cette largeur.',
          },
          {
            title: 'Collage du plateau',
            body: 'Serrage progressif sur vingt-quatre heures. Alternance du sens des cernes pour limiter le tuilage. Deux serre-joints de plus que prévu, la planche du milieu vrillait.',
          },
        ],
      },
      {
        title: "Bibliothèque d'angle",
        summary: 'Frêne teinté, montants assemblés à tenons et mortaises.',
        status: 'COMPLETED',
        createdAt: daysAgo(34),
        steps: [
          {
            title: 'Relevé des cotes',
            body: "Le mur n'est pas d'équerre : trois degrés d'écart sur deux mètres, à rattraper dans les montants plutôt que dans les étagères.",
          },
          {
            title: 'Assemblage',
            body: 'Tenons et mortaises traditionnels, sans vis apparente. Montage à blanc avant collage définitif.',
          },
          {
            title: 'Teinte et finition',
            body: 'Teinte à l\'eau, deux couches, égrenage entre les deux. Le frêne boit beaucoup, la première couche disparaît presque.',
          },
        ],
      },
      {
        title: 'Réfection de six chaises de bistrot',
        summary: 'Hêtre cintré des années trente, assemblages à reprendre.',
        status: 'COMPLETED',
        createdAt: daysAgo(72),
        steps: [
          { title: 'Démontage', body: 'Colle d\'origine désolidarisée à la vapeur. Deux pieds fendus à recoller, un à refaire entièrement.' },
          { title: 'Recollage', body: 'Colle animale, comme à l\'origine : réversible, ce qui laisse la porte ouverte à une prochaine réfection dans cinquante ans.' },
        ],
      },
    ],
  },
  {
    pseudo: 'Atelier Ravel',
    palette: 'acier',
    email: 'ravel@exemple.fr',
    craft: 'Mécanique ancienne',
    city: 'Le Pecq',
    bio: "Restauration de moteurs de collection. Le carnet sert autant au client qu'à moi : tout est tracé, rien ne se perd.",
    projects: [
      {
        title: 'Réfection moteur 4 cylindres, 1972',
        summary: 'Dépose complète, rectification, remontage aux couples constructeur.',
        status: 'IN_PROGRESS',
        createdAt: daysAgo(3),
        steps: [
          {
            title: 'Dépose et état des lieux',
            body: 'Segmentation hors cote, coussinets marqués. La culasse est saine, ce qui est une bonne nouvelle : les pièces neuves sont introuvables.',
          },
          {
            title: 'Rectification du vilebrequin',
            body: 'Cote réparation 0,25. Contrôle géométrique conforme après passage. Faux-rond dans les tolérances.',
          },
        ],
      },
      {
        title: 'Carburateur double corps, remise en état',
        summary: 'Démontage complet, bain à ultrasons, réglage au banc.',
        status: 'COMPLETED',
        createdAt: daysAgo(41),
        steps: [
          { title: 'Démontage et repérage', body: 'Photo à chaque étape : trois gicleurs de diamètres proches, impossible à retrouver de mémoire au remontage.' },
          { title: 'Nettoyage', body: 'Ultrasons quarante minutes. Deux passages nécessaires, le vernis d\'essence ancienne est tenace.' },
          { title: 'Réglage', body: 'Richesse ajustée au banc. Reprise franche, plus de trou à l\'accélération.' },
        ],
      },
    ],
  },
  {
    pseudo: 'Terre & Feu',
    palette: 'terre',
    email: 'terrefeu@exemple.fr',
    craft: 'Céramique',
    city: 'Chatou',
    bio: 'Grès émaillé tourné à la main. Les cuissons ratées sont documentées aussi : elles apprennent plus que les réussies.',
    projects: [
      {
        title: "Service de six bols, émail céladon",
        summary: 'Grès blanc, tournage en série, cuisson à 1280 °C.',
        status: 'IN_PROGRESS',
        createdAt: daysAgo(9),
        steps: [
          { title: 'Tournage', body: 'Huit bols tournés pour six commandés. Le retrait à la cuisson est de douze pour cent, et deux pièces se fendent toujours.' },
          { title: 'Tournassage', body: 'Pied dégagé au tour, à mi-sec. C\'est le moment le plus risqué : trop sec, ça éclate ; trop humide, ça se déforme.' },
          { title: 'Émaillage', body: 'Céladon appliqué par trempage, deux secondes. L\'épaisseur décide de la couleur finale plus que la composition.' },
        ],
      },
      {
        title: 'Grande jarre, cuisson au bois',
        summary: 'Un mètre de haut, montée à la plaque, cuite en quatre jours.',
        status: 'COMPLETED',
        createdAt: daysAgo(58),
        steps: [
          { title: 'Montage à la plaque', body: 'Cinq séances, une plaque par jour : monter plus vite ferait s\'affaisser le bas sous son propre poids.' },
          { title: 'Séchage lent', body: 'Trois semaines sous plastique perforé. Le séchage rapide est la première cause de fente sur ces volumes.' },
          { title: 'Cuisson au bois', body: 'Quatre-vingt-seize heures, alimentation toutes les vingt minutes la dernière nuit. Les traces de flamme ne se commandent pas.' },
        ],
      },
      {
        title: 'Essais de glaçures au frêne',
        summary: 'Cendres de frêne de l\'atelier, six proportions testées.',
        status: 'COMPLETED',
        createdAt: daysAgo(88),
        steps: [
          { title: 'Préparation des cendres', body: 'Lavées trois fois, tamisées. Les cendres brutes contiennent trop de potasse et coulent à la cuisson.' },
          { title: 'Plaquettes d\'essai', body: 'Six proportions de dix à soixante pour cent. Seules deux sont exploitables, mais elles sont belles.' },
        ],
      },
    ],
  },
  {
    pseudo: 'Lutherie Vasseur',
    palette: 'epicea',
    email: 'vasseur@exemple.fr',
    craft: 'Lutherie',
    city: 'Maisons-Laffitte',
    bio: 'Guitares classiques et réparations. Un instrument est un objet de mesure autant qu\'un objet de bois.',
    projects: [
      {
        title: 'Guitare classique, épicéa et palissandre',
        summary: 'Barrage éventail, manche à talon rapporté.',
        status: 'IN_PROGRESS',
        createdAt: daysAgo(12),
        steps: [
          { title: 'Sélection de la table', body: 'Épicéa de Bosnie, fil serré et régulier. Frappée à l\'oreille avant achat : la résonance se juge en une seconde.' },
          { title: 'Barrage de la table', body: 'Sept barres en éventail. Chaque barre est rabotée jusqu\'à ce que la table sonne juste, pas jusqu\'à une cote.' },
          { title: 'Éclisses et moule', body: 'Cintrage au fer à 160 °C, palissandre humidifié. Une éclisse a fendu, refaite le lendemain.' },
          { title: 'Collage du fond', body: 'Colle animale et contre-moule. Vingt-quatre heures de prise avant démoulage.' },
        ],
      },
      {
        title: 'Remise en état, guitare des années soixante',
        summary: 'Décollement du chevalet, frettage usé, réglage complet.',
        status: 'COMPLETED',
        createdAt: daysAgo(47),
        steps: [
          { title: 'Diagnostic', body: 'Chevalet décollé sur quatre centimètres, table légèrement bombée. L\'instrument était stocké trop sec.' },
          { title: 'Recollage du chevalet', body: 'Ancienne colle retirée au ciseau, surface reprise. Serrage par l\'intérieur avec un valet fabriqué pour l\'occasion.' },
        ],
      },
    ],
  },
  {
    pseudo: 'Forge du Vésinet',
    palette: 'forge',
    email: 'forge@exemple.fr',
    craft: 'Coutellerie',
    city: 'Le Vésinet',
    bio: 'Couteaux forgés à la main, acier au carbone. Chaque lame est numérotée et son traitement thermique consigné.',
    projects: [
      {
        title: 'Couteau de cuisine, lame de 210 mm',
        summary: 'Acier XC75, manche en noyer stabilisé.',
        status: 'IN_PROGRESS',
        createdAt: daysAgo(2),
        steps: [
          { title: 'Forgeage', body: 'Barre de 5 mm étirée à la main. Six chaudes, en surveillant la couleur : au-delà du jaune paille, l\'acier se brûle et le grain grossit.' },
          { title: 'Recuit et profilage', body: 'Recuit lent dans la cendre pour détendre la lame avant usinage. Profil tracé puis dégrossi à la lime.' },
        ],
      },
      {
        title: 'Série de six couteaux de table',
        summary: 'Même lame, six essences de manche différentes.',
        status: 'COMPLETED',
        createdAt: daysAgo(29),
        steps: [
          { title: 'Forgeage en série', body: 'Six lames en une journée. La régularité est plus dure à tenir que la performance sur une pièce unique.' },
          { title: 'Traitement thermique', body: 'Trempe à l\'huile, revenu à 200 °C pendant deux heures. Dureté mesurée à 58 HRC sur la chute témoin.' },
          { title: 'Montage des manches', body: 'Noyer, olivier, buis, cormier, prunier, hêtre échauffé. Le cormier est le plus dur à travailler et le plus beau.' },
        ],
      },
      {
        title: 'Restauration d\'une hache de charpentier',
        summary: 'Outil ancien, tranchant à reconstituer, manche à refaire.',
        status: 'ARCHIVED',
        createdAt: daysAgo(96),
        steps: [
          { title: 'Décapage', body: 'Rouille traitée à l\'acide citrique, quarante-huit heures. Le marquage du forgeron réapparaît, illisible mais présent.' },
        ],
      },
    ],
  },
  {
    pseudo: 'Atelier Solène Marchand',
    palette: 'velours',
    email: 'solene@exemple.fr',
    craft: 'Tapisserie d\'ameublement',
    city: 'Houilles',
    bio: 'Réfection de sièges à l\'ancienne, garniture crin et ressorts. Ce qui se voit dépend entièrement de ce qui ne se voit pas.',
    projects: [
      {
        title: 'Bergère Louis XV, réfection complète',
        summary: 'Garniture traditionnelle, huit ressorts, crin animal.',
        status: 'IN_PROGRESS',
        createdAt: daysAgo(5),
        steps: [
          { title: 'Dégarnissage', body: 'Cinq couches successives retirées, dont deux réfections antérieures. La dernière datait des années soixante, à la mousse.' },
          { title: 'Sanglage', body: 'Sangles de jute croisées et tendues au tire-sangle. C\'est là que se joue la tenue des trente prochaines années.' },
          { title: 'Pose des ressorts', body: 'Huit ressorts cousus sur les sangles, guindés en trois rangs. Le guindage donne la forme du dossier avant même la garniture.' },
        ],
      },
      {
        title: 'Banquette de piano, garniture piquée',
        summary: 'Crin végétal, toile forte, point de fond.',
        status: 'COMPLETED',
        createdAt: daysAgo(52),
        steps: [
          { title: 'Mise en crin', body: 'Crin végétal réparti à la main, régularisé au ras du cadre. La moindre irrégularité se lira dans le velours final.' },
          { title: 'Point de fond', body: 'Rangs de points serrés pour maintenir le crin. Deux heures pour un mètre linéaire, et rien ne remplace la main.' },
        ],
      },
    ],
  },
  {
    pseudo: 'Pierre & Trait',
    palette: 'calcaire',
    email: 'pierretrait@exemple.fr',
    craft: 'Taille de pierre',
    city: 'Poissy',
    bio: 'Restauration de pierre de taille et sculpture d\'ornement. Le trait précède toujours l\'outil.',
    projects: [
      {
        title: 'Remplacement d\'un appui de fenêtre en calcaire',
        summary: 'Relevé, taille en atelier, pose au mortier de chaux.',
        status: 'IN_PROGRESS',
        createdAt: daysAgo(15),
        steps: [
          { title: 'Relevé et gabarit', body: 'Gabarit en zinc pris sur place. L\'appui d\'origine n\'était pas d\'équerre, le remplacer droit aurait fait un joint ouvert de huit millimètres.' },
          { title: 'Taille du bloc', body: 'Calcaire de Saint-Maximin, tendre et régulier. Dégrossi à la boucharde, fini au ciseau grain d\'orge.' },
        ],
      },
      {
        title: 'Modillon sculpté, copie d\'après moulage',
        summary: 'Pièce d\'origine trop dégradée, copie taillée d\'après empreinte.',
        status: 'COMPLETED',
        createdAt: daysAgo(66),
        steps: [
          { title: 'Moulage de l\'original', body: 'Empreinte silicone sur la pièce en place, avant démontage. La sculpture était lisible à trente pour cent, le reste est une restitution assumée.' },
          { title: 'Mise aux points', body: 'Report des cotes du plâtre au bloc par mise aux points. Méthode lente, mais c\'est la seule qui garantit les proportions.' },
          { title: 'Taille et finition', body: 'Trois semaines. Les creux profonds se taillent en dernier : une fois dégagés, la pierre devient fragile.' },
        ],
      },
    ],
  },
];

const comments = [
  { project: 'Table de ferme en chêne', author: 'Terre & Feu', text: 'Le détail sur le sens des cernes est précieux, merci de le documenter.' },
  { project: 'Table de ferme en chêne', author: 'Atelier Ravel', text: 'Belle bête. Hâte de voir la finition.' },
  { project: 'Table de ferme en chêne', author: 'Lutherie Vasseur', text: 'Trois planches sur onze, ça me parle. Même proportion chez moi pour les tables d\'harmonie.' },
  { project: 'Guitare classique, épicéa et palissandre', author: 'Margaux Ferrand', text: 'Raboter jusqu\'à ce que ça sonne juste plutôt qu\'à une cote : c\'est exactement ce qui sépare le métier de la production.' },
  { project: 'Guitare classique, épicéa et palissandre', author: 'Terre & Feu', text: 'Le coup de l\'éclisse fendue et refaite le lendemain, on connaît tous ça.' },
  { project: 'Grande jarre, cuisson au bois', author: 'Forge du Vésinet', text: 'Quatre-vingt-seize heures de feu, respect. On alimente aussi la nuit sur les grosses cuissons ?' },
  { project: 'Grande jarre, cuisson au bois', author: 'Pierre & Trait', text: 'Les traces de flamme sont superbes. Le hasard bien préparé, en somme.' },
  { project: 'Couteau de cuisine, lame de 210 mm', author: 'Atelier Ravel', text: 'La remarque sur le jaune paille vaut pour la trempe des soupapes aussi. Même logique, autre métier.' },
  { project: 'Bergère Louis XV, réfection complète', author: 'Margaux Ferrand', text: 'Cinq couches dont deux réfections. Le siège raconte son siècle.' },
  { project: 'Bergère Louis XV, réfection complète', author: 'Solène Marchand', text: '' },
  { project: 'Remplacement d\'un appui de fenêtre en calcaire', author: 'Margaux Ferrand', text: 'Le gabarit en zinc plutôt que la cote théorique : même réflexe que pour ma bibliothèque d\'angle.' },
  { project: 'Série de six couteaux de table', author: 'Terre & Feu', text: 'La régularité en série est plus dure que la pièce unique. Vrai pour les bols aussi.' },
  { project: 'Réfection moteur 4 cylindres, 1972', author: 'Forge du Vésinet', text: 'Contrôle géométrique après rectification, c\'est ce qui manque dans quatre-vingts pour cent des réfections qu\'on voit passer.' },
];

/** Abonnements : qui suit qui. */
const follows = [
  ['Terre & Feu', 'Margaux Ferrand'],
  ['Atelier Ravel', 'Margaux Ferrand'],
  ['Lutherie Vasseur', 'Margaux Ferrand'],
  ['Solène Marchand', 'Margaux Ferrand'],
  ['Margaux Ferrand', 'Terre & Feu'],
  ['Margaux Ferrand', 'Lutherie Vasseur'],
  ['Forge du Vésinet', 'Atelier Ravel'],
  ['Atelier Ravel', 'Forge du Vésinet'],
  ['Terre & Feu', 'Pierre & Trait'],
  ['Pierre & Trait', 'Terre & Feu'],
  ['Lutherie Vasseur', 'Terre & Feu'],
  ['Solène Marchand', 'Pierre & Trait'],
];

async function main() {
  console.log('Nettoyage…');
  await prisma.user.deleteMany();

  const byPseudo = new Map();
  const projectsByTitle = new Map();

  let imageCount = 0;

  // `palette` est retirée avant l'écriture : elle sert à composer les visuels,
  // ce n'est pas une colonne du modèle.
  for (const [rank, { projects: projectList, palette, ...artisan }] of artisans.entries()) {
    // Un atelier sur deux dépose une photo de profil : les deux cas d'affichage
    // sont ainsi représentés, avec photo et avec l'initiale de repli.
    const picture =
      rank % 2 === 0
        ? await generateImage({ palette, key: `avatar-${artisan.email}`, folder: 'profils' })
        : null;

    if (picture) imageCount += 1;

    const user = await prisma.user.create({
      data: { ...artisan, picture, password: PASSWORD },
    });
    byPseudo.set(artisan.pseudo, user);

    for (const { steps, createdAt, ...project } of projectList) {
      const coverImage = await generateImage({ palette, key: `cover-${project.title}` });
      imageCount += 1;

      const created = await prisma.project.create({
        data: {
          ...project,
          coverImage,
          createdAt,
          updatedAt: createdAt,
          authorId: user.id,
          steps: {
            create: await Promise.all(
              steps.map(async (step, index) => ({
                ...step,
                position: index + 1,
                // Une étape sur deux est illustrée : un déroulé entièrement
                // imagé ne permet pas de vérifier la mise en page des étapes
                // sans photo.
                image:
                  index % 2 === 0
                    ? await generateImage({
                        palette,
                        key: `step-${project.title}-${index}`,
                        folder: 'steps',
                      })
                    : null,
                // Une étape par jour à partir de l'ouverture du carnet : le
                // déroulé a une chronologie plausible.
                createdAt: new Date(createdAt.getTime() + index * DAY),
              }))
            ),
          },
        },
      });

      imageCount += Math.ceil(steps.length / 2);
      projectsByTitle.set(project.title, created);
    }

    console.log(`  ${artisan.pseudo.padEnd(26)} ${projectList.length} carnet(s)`);
  }

  // Les pseudos courts utilisés dans les commentaires sont résolus de façon
  // tolérante : « Solène Marchand » désigne « Atelier Solène Marchand ».
  const findUser = (name) =>
    byPseudo.get(name) ??
    [...byPseudo.values()].find((u) => u.pseudo.includes(name)) ??
    null;

  let commentCount = 0;
  for (const { project, author, text } of comments) {
    const target = projectsByTitle.get(project);
    const user = findUser(author);

    // Un commentaire vide est ignoré plutôt que de faire échouer le seed :
    // la contrainte de non-vacuité appartient à la validation, pas aux données.
    if (!target || !user || !text.trim()) continue;

    await prisma.comment.create({
      data: {
        projectId: target.id,
        authorId: user.id,
        text,
        createdAt: new Date(target.createdAt.getTime() + DAY),
      },
    });
    commentCount += 1;
  }

  let followCount = 0;
  for (const [follower, following] of follows) {
    const a = findUser(follower);
    const b = findUser(following);
    if (!a || !b || a.id === b.id) continue;

    await prisma.follow.create({ data: { followerId: a.id, followingId: b.id } });
    followCount += 1;
  }

  // Chaque carnet reçoit quelques votes d'ateliers qui ne sont pas le sien,
  // en quantité variable pour que le classement ait du relief.
  const users = [...byPseudo.values()];
  let likeCount = 0;

  for (const [index, project] of [...projectsByTitle.values()].entries()) {
    const voters = users.filter((u) => u.id !== project.authorId).slice(0, (index % 4) + 1);

    for (const voter of voters) {
      await prisma.like.create({ data: { projectId: project.id, userId: voter.id } });
      likeCount += 1;
    }
  }

  console.log(
    `\n${byPseudo.size} ateliers · ${projectsByTitle.size} carnets · ${commentCount} échanges · ${followCount} abonnements · ${likeCount} votes · ${imageCount} visuels générés`
  );
  console.log(`Mot de passe commun : ${PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
