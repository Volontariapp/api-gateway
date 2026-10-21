import { UserRoles } from '@volontariapp/shared';

export interface GoldenPersona {
  email: string;
  pseudo: string;
  password: string;
  role: UserRoles;
  bio: string;
  focus?: 'ecology' | 'social' | 'newbie' | 'admin' | 'organizer';
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
  },
  {
    email: 'organizer@volontariapp.fr',
    pseudo: 'AssociationParisSolidarite',
    password: SEED_DEFAULT_PASSWORD,
    role: UserRoles.VOLUNTEER,
    bio: 'Coordination d’actions solidaires et citoyennes dans le Grand Paris.',
    focus: 'organizer',
  },
  {
    email: 'volunteer.eco@volontariapp.fr',
    pseudo: 'ThomasEcolo',
    password: SEED_DEFAULT_PASSWORD,
    role: UserRoles.VOLUNTEER,
    bio: 'Passionné de biodiversité urbaine, cleanwalks et protection des berges.',
    focus: 'ecology',
  },
  {
    email: 'volunteer.social@volontariapp.fr',
    pseudo: 'SarahEntraide',
    password: SEED_DEFAULT_PASSWORD,
    role: UserRoles.VOLUNTEER,
    bio: 'Engagée dans les maraudes nocturnes et la distribution de repas chauds.',
    focus: 'social',
  },
  {
    email: 'volunteer.newbie@volontariapp.fr',
    pseudo: 'AlexandreNouveau',
    password: SEED_DEFAULT_PASSWORD,
    role: UserRoles.VOLUNTEER,
    bio: 'Nouveau bénévole prêt à découvrir sa première mission !',
    focus: 'newbie',
  },
];
