import { UserRoles } from '@volontariapp/shared';

export interface GoldenPersona {
  email: string;
  pseudo: string;
  password: string;
  role: UserRoles;
  bio: string;
  focus?:
    | 'ecology'
    | 'social'
    | 'animals'
    | 'education'
    | 'cycling'
    | 'garden'
    | 'seniors'
    | 'newbie'
    | 'admin'
    | 'organizer';
  firstName?: string;
  lastName?: string;
}

export const SEED_DEFAULT_PASSWORD = 'Password123!';

export const GOLDEN_PERSONAS: GoldenPersona[] = [
  {
    email: 'admin@volontariapp.fr',
    pseudo: 'SuperAdmin',
    password: SEED_DEFAULT_PASSWORD,
    role: UserRoles.ADMIN,
    bio: 'Administrateur système de la plateforme VolontariApp.',
    focus: 'admin',
    firstName: 'Admin',
    lastName: 'Système',
  },
  {
    email: 'organizer@volontariapp.fr',
    pseudo: 'AssociationParisSolidarite',
    password: SEED_DEFAULT_PASSWORD,
    role: UserRoles.VOLUNTEER,
    bio: 'Coordination d’actions solidaires et citoyennes dans le Grand Paris.',
    focus: 'organizer',
    firstName: 'Claire',
    lastName: 'Vasseur',
  },
  {
    email: 'volunteer.eco@volontariapp.fr',
    pseudo: 'ThomasEcolo',
    password: SEED_DEFAULT_PASSWORD,
    role: UserRoles.VOLUNTEER,
    bio: 'Passionné de biodiversité urbaine, cleanwalks et protection des berges.',
    focus: 'ecology',
    firstName: 'Thomas',
    lastName: 'Moreau',
  },
  {
    email: 'volunteer.social@volontariapp.fr',
    pseudo: 'SarahEntraide',
    password: SEED_DEFAULT_PASSWORD,
    role: UserRoles.VOLUNTEER,
    bio: 'Engagée dans les maraudes nocturnes et la distribution de repas chauds.',
    focus: 'social',
    firstName: 'Sarah',
    lastName: 'Benali',
  },
  {
    email: 'volunteer.newbie@volontariapp.fr',
    pseudo: 'AlexandreNouveau',
    password: SEED_DEFAULT_PASSWORD,
    role: UserRoles.VOLUNTEER,
    bio: 'Nouveau bénévole prêt à découvrir sa première mission !',
    focus: 'newbie',
    firstName: 'Alexandre',
    lastName: 'Lemoine',
  },
];

const FIRST_NAMES = [
  'Lucas',
  'Emma',
  'Mohamed',
  'Chloé',
  'Antoine',
  'Fatima',
  'Thomas',
  'Léa',
  'Alexandre',
  'Inès',
  'Maxime',
  'Camille',
  'Julien',
  'Sarah',
  'Nicolas',
  'Manon',
  'Hugo',
  'Yasmine',
  'Kevin',
  'Jade',
  'Mehdi',
  'Julie',
  'Valentin',
  'Amina',
  'Romain',
  'Clara',
  'Baptiste',
  'Laura',
  'Nathan',
  'Justine',
  'Clément',
  'Pauline',
  'Gabriel',
  'Marion',
  'Raphaël',
  'Anaïs',
  'Mathieu',
  'Charlotte',
  'Arthur',
  'Lucie',
  'Paul',
  'Océane',
  'Théo',
  'Eva',
  'Pierre',
  'Zoé',
  'Louis',
  'Mathilde',
  'Victor',
  'Morgane',
];

const LAST_NAMES = [
  'Martin',
  'Bernard',
  'Dubois',
  'Thomas',
  'Robert',
  'Richard',
  'Petit',
  'Durand',
  'Leroy',
  'Moreau',
  'Simon',
  'Laurent',
  'Lefebvre',
  'Michel',
  'Garcia',
  'David',
  'Bertrand',
  'Roux',
  'Vincent',
  'Fournier',
  'Morel',
  'Girard',
  'Andre',
  'Lefevre',
  'Mercier',
  'Dupont',
  'Lambert',
  'Bonnet',
  'Francois',
  'Martinez',
  'Legrand',
  'Garnier',
  'Faure',
  'Rousseau',
  'Blanc',
  'Guerin',
  'Muller',
  'Henry',
  'Roussel',
  'Nicolas',
  'Perrin',
  'Morin',
  'Mathieu',
  'Clement',
  'Gauthier',
  'Dumont',
  'Lopez',
  'Fontaine',
  'Chevalier',
  'Robin',
  'Benali',
  'Traoré',
  'Diallo',
  'Chen',
  'Nguyen',
];

const BIOS_BY_FOCUS: Record<string, string[]> = {
  ecology: [
    'Étudiant en sciences de l’environnement, adepte de cleanwalks et de tri sélectif.',
    'Passionné de nature et de faune sauvage, actif lors des dépollutions des cours d’eau.',
    'Bénévole engagé pour la réduction des plastiques et la préservation des forêts d’Île-de-France.',
    'Jardinier urbain et militant pour le zéro déchet dans son quartier.',
  ],
  social: [
    'Infirmier en milieu hospitalier, bénévole dans les maraudes nocturnes du week-end.',
    'Engagée dans la distribution de repas chauds et l’accueil de jour des personnes sans-abri.',
    'Militante solidaire pour briser l’isolement et apporter chaleur humaine et écoute.',
    'Volontaire actif pour les collectes alimentaires d’urgence et les colis solidaires.',
  ],
  animals: [
    'Amoureux des animaux, bénévole régulier en refuge pour promener les chiens et soigner les chats.',
    'Engagé dans la protection animale, l’entretien des enclos et la sensibilisation à l’adoption.',
    'Passionné par le bien-être animal et le réconfort des pensionnaires de la SPA.',
  ],
  education: [
    'Professeur des écoles engagé dans l’aide aux devoirs et le soutien scolaire en quartier populaire.',
    'Étudiante en mathématiques, bénévole pour redonner confiance aux collégiens en difficulté.',
    'Passionné par la transmission des savoirs et les ateliers d’écriture pour enfants.',
  ],
  cycling: [
    'Mécanicien cycles bénévole, fervent défenseur de la mobilité douce et de l’autoréparation.',
    'Cycliste urbain passionné de mécanique vélo et de récupération d’anciennes bicyclettes.',
    'Animateur d’ateliers Répar’Vélo pour rendre le vélo accessible à tous.',
  ],
  garden: [
    'Permaculteur passionné, bénévole dans les jardins partagés et potagers communautaires.',
    'Amoureux de la terre et de la biodiversité urbaine, actif dans la plantation d’arbres fruitiers.',
    'Jardinier du dimanche engagé pour la création d’îlots de fraîcheur dans la ville.',
  ],
  seniors: [
    'Visiteur bénévole en EHPAD, engagé pour écouter les aînés et partager des après-midi jeux.',
    'Passionnée par les liens intergénérationnels, la lecture partagée et les récits de vie.',
    'Bénévole pour accompagner les personnes âgées isolées lors de promenades au parc.',
  ],
};

const FOCUS_LIST = [
  'ecology',
  'social',
  'animals',
  'education',
  'cycling',
  'garden',
  'seniors',
] as const;

/**
 * Génère une liste de 500 profils de personas 100% uniques et réalistes.
 */
export function generate500Personas(): GoldenPersona[] {
  const personas: GoldenPersona[] = [...GOLDEN_PERSONAS];

  for (let i = personas.length; i < 500; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const focus = FOCUS_LIST[i % FOCUS_LIST.length];
    const bios = BIOS_BY_FOCUS[focus] ?? BIOS_BY_FOCUS.ecology;
    const bio = bios[i % bios.length];

    const cleanFirst = firstName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const cleanLast = lastName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const email = `${cleanFirst}.${cleanLast}.${String(i + 1)}@volontariapp.fr`;
    const pseudo = `${firstName}${cleanLast.charAt(0).toUpperCase()}${String(i + 1)}`;

    personas.push({
      email,
      pseudo,
      password: SEED_DEFAULT_PASSWORD,
      role: UserRoles.VOLUNTEER,
      bio,
      focus,
      firstName,
      lastName,
    });
  }

  return personas;
}
