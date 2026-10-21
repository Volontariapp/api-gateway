export interface EventThematicTemplate {
  category: 'ecology' | 'solidarity' | 'animals' | 'education' | 'cycling' | 'seniors' | 'garden';
  titles: string[];
  descriptions: string[];
  tagSlugs: string[];
  requirements: string[];
  imageTheme: string;
}

export const THEMATIC_EVENT_TEMPLATES: EventThematicTemplate[] = [
  {
    category: 'ecology',
    imageTheme: 'ecology',
    tagSlugs: ['ecologie', 'nature', 'dechets', 'climat'],
    titles: [
      'Grande Cleanwalk des Berges',
      'Nettoyage citoyen et tri des plastiques',
      'Opération zéro déchet au parc',
      'Collecte de mégots et sensibilisation urbaine',
      'Dépollution des sentiers forestiers',
      'Action fleuve propre : sauvons notre écosystème',
    ],
    descriptions: [
      'Rejoignez-nous pour ramasser les déchets et sensibiliser les promeneurs. Gants et sacs fournis ! Ensemble, redonnons vie à nos espaces verts.',
      'Action citoyenne de nettoyage et de tri sélectif. Chaque geste compte pour éviter que le plastique ne finisse dans les cours d’eau.',
      'Matinée active et conviviale en plein air pour préserver la faune et la flore locale. Pesée et tri des déchets en fin d’événement.',
    ],
    requirements: [
      'Gants de protection',
      'Vêtements peu salissants',
      'Chaussures fermées',
      'Gourde d’eau',
    ],
  },
  {
    category: 'solidarity',
    imageTheme: 'solidarity',
    tagSlugs: ['solidarite', 'maraude', 'entraide', 'social'],
    titles: [
      'Maraude nocturne et distribution de repas chauds',
      'Collecte et tri de vêtements d’hiver',
      'Distribution alimentaire solidaire du week-end',
      'Accueil de jour et petit-déjeuner partagé',
      'Colis d’urgence et kits d’hygiène pour tous',
      'Café solidaire et écoute fraternelle',
    ],
    descriptions: [
      'Nous allons à la rencontre des personnes sans-abri pour apporter nourriture, boissons chaudes et chaleur humaine. Un temps d’échange essentiel.',
      'Aidez-nous à conditionner et distribuer des paniers de denrées de première nécessité aux familles et étudiants en situation de précarité.',
      'Moment de partage et de bienveillance pour briser l’isolement. Votre présence et vos sourires font toute la différence.',
    ],
    requirements: [
      'Chaussures confortables pour la marche',
      'Vêtements chauds',
      'Esprit d’écoute et de bienveillance',
    ],
  },
  {
    category: 'animals',
    imageTheme: 'animals',
    tagSlugs: ['animaux', 'protection-animale', 'refuge', 'nature'],
    titles: [
      'Promenade et réconfort pour les chiens du refuge',
      'Entretien et aménagement du refuge animalier',
      'Collecte de croquettes et soins aux animaux',
      'Journée portes ouvertes et adoption solidaire',
      'Aide aux soins et brossage des pensionnaires',
    ],
    descriptions: [
      'Venez offrir une belle balade et des moments de jeux aux chiens du refuge qui attendent une famille aimante.',
      'Aidez l’équipe du refuge pour le nettoyage des enclos, la distribution des repas et le bien-être de nos pensionnaires.',
      'Nos amis à quatre pattes ont besoin d’attention et de tendresse. Participez à une après-midi enrichissante et pleine d’amour.',
    ],
    requirements: [
      'Tenue adaptée aux animaux',
      'Patience et douceur',
      'Friandises canines bienvenues',
    ],
  },
  {
    category: 'education',
    imageTheme: 'education',
    tagSlugs: ['education', 'soutien-scolaire', 'jeunesse', 'culture'],
    titles: [
      'Atelier d’aide aux devoirs et soutien scolaire',
      'Lecture de contes et éveil culturel pour les petits',
      'Initiation au numérique pour enfants et adolescents',
      'Accompagnement méthodologique pour les collégiens',
      'Club d’écriture et d’expression solidaire',
    ],
    descriptions: [
      'Aidez des enfants de l’école primaire et du collège à progresser en français et mathématiques dans une ambiance ludique et stimulante.',
      'Partagez votre goût de la lecture et de la découverte auprès d’enfants de quartiers populaires pour favoriser la réussite de tous.',
      'Un accompagnement bienveillant pour redonner confiance aux jeunes et leur transmettre des méthodes d’apprentissage durables.',
    ],
    requirements: [
      'Pédagogie et bienveillance',
      'Goût de la transmission',
      'Cahier de notes ou stylos',
    ],
  },
  {
    category: 'cycling',
    imageTheme: 'cycling',
    tagSlugs: ['velo', 'recyclage', 'ecologie', 'mobilite'],
    titles: [
      'Atelier Répar’Vélo participatif et solidaire',
      'Remise en état de bicyclettes pour personnes précaires',
      'Initiation à la mécanique vélo et autoréparation',
      'Diagnostic et réglage sécurité des vélos urbains',
    ],
    descriptions: [
      'Apprenez à réparer crevaisons, freins et dérailleurs tout en aidant les participants à remettre leur vélo en circulation.',
      'Atelier convivial où chacun partage ses compétences pour promouvoir la mobilité douce et le réemploi solidaire.',
    ],
    requirements: [
      'Vêtements ne craignant pas la graisse',
      'Outils si vous en possédez',
      'Bonne humeur',
    ],
  },
  {
    category: 'garden',
    imageTheme: 'garden',
    tagSlugs: ['jardinage', 'permaculture', 'vegetalisation', 'nature'],
    titles: [
      'Plantation d’arbres et restauration de haies vives',
      'Jardinage partagé et préparation des semis de saison',
      'Création d’un potager pédagogique de quartier',
      'Désherbage manuel et paillage écologique',
    ],
    descriptions: [
      'Opération mains dans la terre ! Venez planter des arbustes mellifères et créer des îlots de fraîcheur pour la biodiversité.',
      'Participez aux récoltes, aux semis et à l’entretien d’un potager collaboratif qui redistribue ses légumes aux habitants.',
    ],
    requirements: ['Bottes ou baskets solides', 'Gants de jardinage', 'Bouteille d’eau'],
  },
  {
    category: 'seniors',
    imageTheme: 'seniors',
    tagSlugs: ['seniors', 'ehpad', 'intergenerationnel', 'solidarite'],
    titles: [
      'Visite d’amitié et après-midi jeux de société en EHPAD',
      'Promenade accompagnée au parc avec nos aînés',
      'Atelier mémoire et partage de récits de vie',
      'Concert acoustique et goûter partagé avec les résidents',
    ],
    descriptions: [
      'Offrez un moment de joie et de présence à des personnes âgées isolées. Discussion, rires et écoute au programme.',
      'Partagez un après-midi réconfortant autour de jeux de société classiques ou d’une balade apaisante.',
    ],
    requirements: ['Sens de l’écoute et empathie', 'Sourire et patience'],
  },
];

export const POST_TEMPLATES = [
  {
    title: 'Retour d’expérience : une mobilisation formidable !',
    content:
      'Une journée inoubliable avec des bénévoles investis et chaleureux. Nous avons accompli un travail remarquable ensemble.',
  },
  {
    title: 'Fiers de notre impact aujourd’hui',
    content:
      'Chaque heure consacrée aux autres porte ses fruits. Merci infiniment à toutes celles et ceux qui ont répondu présent !',
  },
  {
    title: 'Souvenirs d’une matinée solidaire',
    content:
      'Quelques photos pour immortaliser cette belle action. Le lien humain et l’entraide sont plus vivants que jamais.',
  },
  {
    title: 'Objectif dépassé pour notre mission !',
    content:
      'Nous avions prévu d’aider 30 personnes, nous en avons touché plus de 60 grâce à votre générosité. Bravo à toute l’équipe !',
  },
  {
    title: 'À très bientôt pour la prochaine édition',
    content:
      'Un grand merci aux organisateurs pour la logistique impeccable. Qui sera de la partie pour la session suivante ?',
  },
];

export const COMMENT_TEMPLATES = [
  'Bravo à tous pour cette superbe initiative ! 👏',
  'C’était génial de participer, vivement la prochaine fois !',
  'Merci pour l’organisation, c’était fluide et très enrichissant.',
  'Quel plaisir de voir autant de monde réuni pour une belle cause.',
  'Félicitations pour le résultat, continuez comme ça !',
  'J’ai adoré partager ce moment avec vous, à très vite !',
  'Un grand merci aux bénévoles présents, vous êtes inspirants.',
];
