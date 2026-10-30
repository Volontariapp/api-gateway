import type { SeedLocation } from './seed-locations.constant.js';

export interface SeedMaterialRequirement {
  name: string;
  description: string;
  neededQuantity: number;
}

export interface SeedEventBlueprint {
  title: string;
  description: string;
  category: 'ecology' | 'solidarity' | 'animals' | 'education' | 'cycling' | 'garden' | 'seniors';
  imageTheme: string;
  tagSlugs: string[];
  materials: SeedMaterialRequirement[];
  suggestedMaxParticipants: number;
}

export interface SeedPostBlueprint {
  title: string;
  content: string;
  category: 'ecology' | 'solidarity' | 'animals' | 'education' | 'cycling' | 'garden' | 'seniors';
  imageTheme: string;
}

export interface EventThematicTemplate {
  category: 'ecology' | 'solidarity' | 'animals' | 'education' | 'cycling' | 'seniors' | 'garden';
  imageTheme: string;
  tagSlugs: string[];
  actionVerbs: string[];
  specificThemes: string[];
  descriptions: string[];
  materials: SeedMaterialRequirement[];
}

export const THEMATIC_EVENT_TEMPLATES: EventThematicTemplate[] = [
  {
    category: 'ecology',
    imageTheme: 'ecology',
    tagSlugs: ['ecologie', 'nature', 'dechets', 'climat'],
    actionVerbs: [
      'Grande Cleanwalk citoyenne pour',
      'Opération zéro déchet et tri sélectif de',
      'Collecte participative et dépollution de',
      'Chantier éco-citoyen de ramassage de',
      'Action fleuve propre et nettoyage de',
      'Mobilisation citoyenne contre les dépôts sauvages de',
      'Matinée de dépollution et valorisation de',
      'Défi collectif : zéro plastique et collecte de',
    ],
    specificThemes: [
      'plastiques et emballages sur les berges',
      'mégots de cigarettes en zone urbaine',
      'canettes métalliques et verre recyclable',
      'déchets flottants et débris de berge',
      'encombrants et dépôts sauvages en lisière de forêt',
      'micro-déchets polluants dans les parcs publics',
      'bouteilles et capsules le long des canaux',
      'sentiers naturels et sous-bois boisés',
    ],
    descriptions: [
      'Rejoignez-nous pour ramasser les déchets et sensibiliser les promeneurs. Gants, sacs et pinces sont fournis sur place ! Pesée et tri sélectif collectif en fin de matinée.',
      'Action citoyenne essentielle pour empêcher que les plastiques ne se dégradent et ne polluent nos cours d’eau. Venez en famille ou entre amis pour un geste écologique concret.',
      'Matinée conviviale et active en plein air pour redonner éclat et biodiversité à nos espaces naturels. Un moment d’action directe et de convivialité partagée.',
    ],
    materials: [
      {
        name: 'Gants de protection anti-coupure (taille M/L)',
        description: 'Gants renforcés normés EN 388 pour manipuler verre et métaux en sécurité',
        neededQuantity: 35,
      },
      {
        name: 'Sacs poubelle renforcés 100L haute résistance',
        description:
          'Sacs étanches en plastique recyclé pour tri sélectif des plastiques et métaux',
        neededQuantity: 60,
      },
      {
        name: 'Pinces de ramassage télescopiques 90cm',
        description: 'Pinces ergonomiques avec embouts antidérapants pour éviter de se baisser',
        neededQuantity: 20,
      },
      {
        name: 'Pesons électroniques suspendus numériques',
        description:
          'Balances précises pour mesurer et consigner le poids total des déchets récoltés',
        neededQuantity: 4,
      },
      {
        name: 'Gilets de sécurité haute visibilité',
        description: 'Gilets fluorescents pour assurer la sécurité du groupe en bordure de voirie',
        neededQuantity: 25,
      },
    ],
  },
  {
    category: 'solidarity',
    imageTheme: 'solidarity',
    tagSlugs: ['solidarite', 'maraude', 'entraide', 'social'],
    actionVerbs: [
      'Maraude nocturne solidaire et distribution de',
      'Collecte d’urgence et tri de',
      'Accueil solidaire et partage de',
      'Distribution alimentaire de denrées et de',
      'Action grand froid : approvisionnement en',
      'Tournée de fraternité et livraison de',
      'Atelier d’entraide et confection de',
    ],
    specificThemes: [
      'repas chauds complets et soupes réconfortantes',
      'duvets isothermiques et vêtements d’hiver',
      'paniers de première nécessité pour familles isolées',
      'kits d’hygiène essentiels et soins du quotidien',
      'boissons chaudes, thés et cafés réconfortants',
      'chaussettes thermiques, gants et bonnets neufs',
      'colis alimentaires d’urgence et produits bébé',
    ],
    descriptions: [
      'Nous allons à la rencontre des personnes sans-abri pour leur apporter de la nourriture chaude, du matériel thermique et une écoute bienveillante et fraternelle.',
      'Aidez-nous à trier, emballer et distribuer des colis de denrées indispensables pour les étudiants et familles en grande précarité de notre secteur.',
      'Un temps d’échange précieux pour rompre la solitude et réchauffer les cœurs. Votre présence bienveillante et votre sourire ont un impact inestimable.',
    ],
    materials: [
      {
        name: 'Thermos grande capacité 5L inox double paroi',
        description: 'Thermos isothermes pour maintenir soupe et café brûlants toute la soirée',
        neededQuantity: 6,
      },
      {
        name: 'Duvets et sacs de couchage grand froid 0°C',
        description: 'Sacs de couchage neufs et isolants pour les nuits d’hiver dans la rue',
        neededQuantity: 30,
      },
      {
        name: 'Couvertures polaires épaisses lavables',
        description: 'Plaids thermiques doux pour isoler du froid nocturne',
        neededQuantity: 45,
      },
      {
        name: 'Kits d’hygiène individuels complets',
        description:
          'Pochons avec brosse à dents, dentifrice, savon, lingettes et gel hydroalcoolique',
        neededQuantity: 50,
      },
      {
        name: 'Gobelets en carton recyclable 25cl',
        description: 'Gobelets biodégradables double épaisseur pour le service des boissons',
        neededQuantity: 150,
      },
      {
        name: 'Paires de chaussettes thermiques en laine',
        description: 'Chaussettes chaudes neuves indispensables pour prévenir les engelures',
        neededQuantity: 60,
      },
    ],
  },
  {
    category: 'animals',
    imageTheme: 'animals',
    tagSlugs: ['animaux', 'protection-animale', 'refuge', 'nature'],
    actionVerbs: [
      'Grande promenade et socialisation pour',
      'Matinée de soins et réconfort pour',
      'Entretien bienveillant et aménagement pour',
      'Collecte solidaire et distribution de',
      'Journée d’écoute et d’attention envers',
      'Toilettage doux et brossage des',
    ],
    specificThemes: [
      'chiens abandonnés en attente d’adoption',
      'chats recueillis en convalescence',
      'animaux âgés du refuge cherchant un foyer',
      'enclos et parcs d’ébats du refuge',
      'croquettes premium et friandises éducatives',
      'animaux blessés en rééducation motrice',
    ],
    descriptions: [
      'Offrez une belle promenade au grand air et des moments de jeu aux chiens du refuge qui ont tant besoin d’affection et de stimulation.',
      'Participez au nettoyage des boxes, au brossage et au nourrissage des pensionnaires de l’association pour améliorer leur quotidien.',
      'Une après-midi pleine de tendresse et de complicité pour redonner confiance à des animaux qui ont connu des parcours difficiles.',
    ],
    materials: [
      {
        name: 'Sacs de croquettes pour chiens 15kg',
        description: 'Alimentation équilibrée de qualité supérieure pour les pensionnaires',
        neededQuantity: 8,
      },
      {
        name: 'Laisses d’éducation en nylon tressé 2m',
        description: 'Laisses solides avec mousquetons de sécurité pour promenades en extérieur',
        neededQuantity: 15,
      },
      {
        name: 'Gamelles en acier inoxydable antidérapantes',
        description: 'Gamelles hygiéniques lavables et résistantes aux chocs',
        neededQuantity: 20,
      },
      {
        name: 'Brosses et étrilles de démêlage pour pelage',
        description: 'Matériel de toilettage doux pour le brossage et le bien-être animal',
        neededQuantity: 10,
      },
      {
        name: 'Couvertures et coussins lavables pour paniers',
        description: 'Textiles confortables pour isoler le sol des niches et enclos',
        neededQuantity: 30,
      },
    ],
  },
  {
    category: 'education',
    imageTheme: 'education',
    tagSlugs: ['education', 'soutien-scolaire', 'jeunesse', 'culture'],
    actionVerbs: [
      'Atelier participatif de soutien scolaire en',
      'Séance d’aide aux devoirs et méthodologie en',
      'Cercle de lecture et éveil aux contes pour',
      'Initiation numérique et décryptage pour',
      'Club d’écriture créative et expression pour',
      'Tutorat bienveillant et coaching scolaire pour',
    ],
    specificThemes: [
      'mathématiques et sciences pour collégiens',
      'lecture et expression orale pour enfants de primaire',
      'français et orthographe pour collégiens',
      'jeunes en décrochage scolaire ou en reconversion',
      'outils informatiques et compétences numériques',
      'préparation aux examens du brevet et du bac',
    ],
    descriptions: [
      'Accompagnez des élèves dans la compréhension de leurs leçons et la réalisation de leurs devoirs dans un cadre encourageant et bienveillant.',
      'Partagez le plaisir des livres et des histoires avec des enfants pour enrichir leur vocabulaire et développer leur curiosité naturelle.',
      'Une aide personnalisée et patiente pour débloquer les difficultés d’apprentissage et redonner le goût de progresser.',
    ],
    materials: [
      {
        name: 'Cahiers grand format grands carreaux 96p',
        description: 'Cahiers neufs pour exercices de mathématiques et rédactions',
        neededQuantity: 40,
      },
      {
        name: 'Lots de stylos à bille 4 couleurs et crayons',
        description: 'Fournitures scolaires de base pour équiper chaque élève lors de la séance',
        neededQuantity: 25,
      },
      {
        name: 'Dictionnaires illustrés de la langue française',
        description: 'Ouvrages de référence pour les recherches de vocabulaire et définitions',
        neededQuantity: 10,
      },
      {
        name: 'Calculatrices scientifiques collège',
        description: 'Calculatrices pour les résolutions d’équations et géométrie',
        neededQuantity: 12,
      },
      {
        name: 'Livres de contes et romans jeunesse illustrés',
        description: 'Sélection d’ouvrages adaptés aux différents niveaux de lecture',
        neededQuantity: 20,
      },
    ],
  },
  {
    category: 'cycling',
    imageTheme: 'cycling',
    tagSlugs: ['velo', 'recyclage', 'ecologie', 'mobilite'],
    actionVerbs: [
      'Atelier Répar’Vélo participatif : diagnostic et réglage de',
      'Session d’autoréparation solidaire et mécanique de',
      'Remise en état de vélos donnés pour',
      'Bourse aux vélos et révision sécurité de',
      'Atelier apprentissage mécanique : réglage de',
    ],
    specificThemes: [
      'freins, câbles et systèmes de sécurité vélo',
      'transmissions, dérailleurs et chaînes usées',
      'chambres à air, pneus et roues voilées',
      'bicyclettes d’enfants pour les familles modestes',
      'vélos urbains destinés aux trajets quotidiens',
    ],
    descriptions: [
      'Apprenez à diagnostiquer et réparer vos deux-roues grâce aux conseils de nos bénévoles passionnés. Outils et pièces d’occasion disponibles !',
      'Atelier solidaire pour promouvoir le réemploi, la mobilité active et l’autonomie de chacun dans l’entretien de son vélo.',
    ],
    materials: [
      {
        name: 'Pompes à pied d’atelier avec manomètre haute pression',
        description: 'Pompes professionnelles compatibles valves Presta et Schrader',
        neededQuantity: 5,
      },
      {
        name: 'Kits complets de démonte-pneus en nylon renforcé',
        description: 'Outils robustes pour déjanter sans percer les chambres à air',
        neededQuantity: 15,
      },
      {
        name: 'Boîtes de rustines autocollantes et tubes de dissolvant',
        description: 'Nécessaire de réparation rapide pour crevaisons',
        neededQuantity: 30,
      },
      {
        name: 'Jeux de clés Allen métriques hexagonales (2 à 10mm)',
        description: 'Clés en acier chrome-vanadium pour visseries et potences',
        neededQuantity: 8,
      },
      {
        name: 'Burettes de lubrifiant pour chaîne biodégradable',
        description: 'Huile écologique pour transmission par tout temps',
        neededQuantity: 10,
      },
    ],
  },
  {
    category: 'garden',
    imageTheme: 'garden',
    tagSlugs: ['jardinage', 'permaculture', 'vegetalisation', 'nature'],
    actionVerbs: [
      'Chantier participatif de permaculture et semis de',
      'Plantation d’arbres fruitiers et arbustes pour',
      'Entretien collectif du potager solidaire et récolte de',
      'Création d’un îlot de fraîcheur et végétalisation de',
      'Désherbage manuel doux et paillage écologique de',
    ],
    specificThemes: [
      'légumes anciens et semences paysannes',
      'vergers urbains et haies mellifères favorables aux abeilles',
      'parcelles partagées destinées à l’aide alimentaire',
      'massifs floraux et aromatiques du quartier',
      'composteurs partagés et sols vivants',
    ],
    descriptions: [
      'Opération mains dans la terre ! Venez participer aux travaux de saison : plantation, paillage, repiquage et récoltes solidaires.',
      'Un moment convivial en plein air pour apprendre les principes de la permaculture et créer ensemble des oasis de biodiversité.',
    ],
    materials: [
      {
        name: 'Bêches et fourches-bêches en acier forgé',
        description: 'Outils d’aération du sol respectant la vie microbienne souterraine',
        neededQuantity: 10,
      },
      {
        name: 'Brouettes de jardinage 100L renforcées',
        description: 'Brouettes stables pour le transport du compost, terreau et branchages',
        neededQuantity: 4,
      },
      {
        name: 'Arrosoirs galvanisés 10L avec pomme amovible',
        description: 'Arrosoirs ergonomiques pour un arrosage doux et précis des semis',
        neededQuantity: 8,
      },
      {
        name: 'Sacs de terreau biologique horticole 50L',
        description: 'Terreau fertile certifié pour l’agriculture biologique',
        neededQuantity: 15,
      },
      {
        name: 'Sachets de graines reproductibles bio et paysannes',
        description: 'Assortiment de semences de légumes de saison et fleurs compagnes',
        neededQuantity: 30,
      },
    ],
  },
  {
    category: 'seniors',
    imageTheme: 'seniors',
    tagSlugs: ['seniors', 'ehpad', 'intergenerationnel', 'solidarite'],
    actionVerbs: [
      'Après-midi jeux de société et rires partagés avec',
      'Promenade accompagnée au grand air pour',
      'Atelier souvenirs, musique et récits de vie avec',
      'Goûter gourmand intergénérationnel et chants pour',
      'Visites de convivialité et présence chaleureuse auprès de',
    ],
    specificThemes: [
      'nos aînés résidant en maison de retraite',
      'personnes âgées isolées de notre commune',
      'résidents de l’EHPAD pour briser la solitude',
      'seniors amateurs de cartes et jeux de lettres',
      'passionnés de contes et mélodies d’antan',
    ],
    descriptions: [
      'Passez un moment privilégié avec nos aînés autour d’un jeu de cartes, d’une discussion animée ou d’une balade apaisante dans le parc.',
      'Une présence bienveillante et chaleureuse qui apporte joie, sourires et reconnaissance à nos anciens souvent isolés.',
    ],
    materials: [
      {
        name: 'Jeux de société grands formats adaptés',
        description: 'Scrabble géant, triominos et jeux de dominos contrastés',
        neededQuantity: 8,
      },
      {
        name: 'Jeux de cartes à gros caractères lisibles',
        description: 'Jeux de belote et rami pour tournois conviviaux',
        neededQuantity: 15,
      },
      {
        name: 'Enceinte Bluetooth nomade et micro',
        description: 'Diffusion musicale douce et chansons d’époque lors du goûter',
        neededQuantity: 2,
      },
      {
        name: 'Plaids polaires doux lavables',
        description: 'Couvertures douces pour le confort lors des promenades en extérieur',
        neededQuantity: 20,
      },
    ],
  },
];

/**
 * Génère un catalogue de 500 événements distincts, réalistes et non-répétitifs,
 * tous équipés de leurs prérequis matériels précis avec quantités contractuelles.
 */
export function generate500DistinctEvents(locations: SeedLocation[]): SeedEventBlueprint[] {
  const events: SeedEventBlueprint[] = [];
  const total = 500;

  for (let i = 0; i < total; i++) {
    const template = THEMATIC_EVENT_TEMPLATES[i % THEMATIC_EVENT_TEMPLATES.length];
    const location = locations[i % locations.length];

    const action =
      template.actionVerbs[
        Math.floor(i / THEMATIC_EVENT_TEMPLATES.length) % template.actionVerbs.length
      ];
    const theme =
      template.specificThemes[
        Math.floor(i / (THEMATIC_EVENT_TEMPLATES.length * 2)) % template.specificThemes.length
      ];
    const baseDesc = template.descriptions[i % template.descriptions.length];

    const title = `${action} ${theme} - ${location.city} (${location.name})`;
    const description = `${baseDesc} Rendez-vous à ${location.name} (${location.address}, ${location.postalCode} ${location.city}). Rejoignez notre équipe de bénévoles mobilisés pour un impact direct et bienveillant.`;

    // Sélection de 2 à 4 matériels avec quantités adaptées
    const materialCount = 2 + (i % 3); // 2, 3 ou 4 matériels
    const materials: SeedMaterialRequirement[] = [];
    for (let m = 0; m < materialCount; m++) {
      const mat =
        template.materials[(m + (i % template.materials.length)) % template.materials.length];
      materials.push({
        name: mat.name,
        description: mat.description,
        neededQuantity: mat.neededQuantity,
      });
    }

    events.push({
      title,
      description,
      category: template.category,
      imageTheme: template.imageTheme,
      tagSlugs: template.tagSlugs,
      materials,
      suggestedMaxParticipants: 15 + ((i * 7) % 65), // entre 15 et 80
    });
  }

  return events;
}

const POST_ARCHETYPES = [
  {
    theme: 'bilan',
    titlePrefixes: [
      'Bilan chiffré de notre mission à',
      'Résultats impressionnants pour notre action à',
      'Objectifs dépassés pour le projet de',
      'Superbe journée d’action solidaire à',
      'Nos bénévoles ont tout donné à',
    ],
    contentTemplates: [
      'Un immense merci aux bénévoles qui ont répondu présent. Nous avons collecté et trié des dizaines de kilos de matériel et permis à de nombreuses personnes de bénéficier de notre aide immédiate. L’énergie collective était au rendez-vous !',
      'Une matinée d’un engagement exceptionnel. Chaque geste compte pour changer la donne dans nos quartiers. Merci à toute l’équipe pour votre dynamisme et votre bonne humeur contagieuse !',
      'Les chiffres parlent d’eux-mêmes : mission accomplie avec brio ! Bravo aux nouveaux venus qui ont pris leurs marques avec un enthousiasme remarquable.',
    ],
  },
  {
    theme: 'emotion',
    titlePrefixes: [
      'Une rencontre inoubliable aujourd’hui à',
      'Des sourires qui réchauffent le cœur à',
      'Le lien humain au cœur de notre journée à',
      'Moments de partage et d’émotion à',
      'Témoignage émouvant lors de notre passage à',
    ],
    contentTemplates: [
      'Au-delà des chiffres, ce sont les regards, les discussions et les mercis échangés qui nous marquent le plus. Le bénévolat, c’est avant tout une aventure humaine profonde.',
      'Partager quelques heures avec des personnes en difficulté nous rappelle la force de la solidarité. Merci à chacun de semer autant d’espoir autour de soi.',
      'Une journée riche en humanité. Voir des enfants retrouver le sourire ou entendre un aîné nous raconter ses souvenirs n’a pas de prix.',
    ],
  },
  {
    theme: 'technique',
    titlePrefixes: [
      'Retour sur l’atelier mécanique et pratique à',
      'Conseils et apprentissage collaboratif à',
      'Partage de savoir-faire et réparation à',
      'Atelier technique et réemploi réussi à',
    ],
    contentTemplates: [
      'Nous avons remis en état de nombreuses pièces et vélos grâce aux compétences partagées. Transmettre des astuces simples permet de rendre chacun autonome au quotidien.',
      'Apprendre à diagnostiquer, régler et préserver nos objets plutôt que de les jeter : c’est le cœur de notre démarche éco-citoyenne. Bravo aux participants !',
    ],
  },
  {
    theme: 'appel',
    titlePrefixes: [
      'Qui sera de la partie pour la prochaine session à',
      'On prépare déjà la suite de notre action à',
      'Rejoignez notre prochaine mobilisation à',
      'La dynamique continue : rendez-vous à',
    ],
    contentTemplates: [
      'Nous ne comptons pas nous arrêter là ! La prochaine mission arrive très vite et de nouveaux bénévoles sont les bienvenus. Venez vivre cette belle expérience avec nous.',
      'La demande est forte et nous avons besoin de tous les bras disponibles. Inscrivez-vous dès maintenant pour donner un coup de main utile et convivial !',
    ],
  },
];

/**
 * Génère 500 posts d’actualité distincts, engagés et réalistes.
 */
export function generate500DistinctPosts(): SeedPostBlueprint[] {
  const posts: SeedPostBlueprint[] = [];
  const categories: SeedPostBlueprint['category'][] = [
    'ecology',
    'solidarity',
    'animals',
    'education',
    'cycling',
    'garden',
    'seniors',
  ];

  for (let i = 0; i < 500; i++) {
    const archetype = POST_ARCHETYPES[i % POST_ARCHETYPES.length];
    const category = categories[i % categories.length];
    const prefix =
      archetype.titlePrefixes[
        Math.floor(i / POST_ARCHETYPES.length) % archetype.titlePrefixes.length
      ];
    const contentTemplate = archetype.contentTemplates[i % archetype.contentTemplates.length];

    const title = `${prefix} l’événement #${String(i + 1)}`;
    const content = `${contentTemplate} Retrouvez les moments forts de cette initiative et échangeons en commentaires pour continuer à faire grandir le réseau de solidarité VolontariApp.`;

    posts.push({
      title,
      content,
      category,
      imageTheme: category,
    });
  }

  return posts;
}

export const COMMENT_TEMPLATES = [
  'Bravo à tous pour cette superbe initiative ! 👏',
  'C’était génial de participer, vivement la prochaine fois !',
  'Merci pour l’organisation, c’était fluide et très enrichissant.',
  'Quel plaisir de voir autant de monde réuni pour une belle cause.',
  'Félicitations pour le résultat, continuez comme ça !',
  'J’ai adoré partager ce moment avec vous, à très vite !',
  'Un grand merci aux bénévoles présents, vous êtes inspirants.',
  'Superbe ambiance, j’ai beaucoup appris aujourd’hui.',
  'Très fier d’avoir apporté ma modeste pierre à l’édifice.',
  'Excellente action, on remet ça le mois prochain !',
];
