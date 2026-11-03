/** Premiere page (toute la pagination de la gateway est en base 1). */
export const DEFAULT_PAGE = 1;

/** Taille de page quand le client n'en envoie pas. */
export const DEFAULT_LIMIT = 10;

/** Plafond applique a toutes les routes de liste (une valeur plus grande est ecretee, jamais rejetee). */
export const MAX_LIMIT = 100;

/** Plafond des seules routes que les anciennes versions de nativapp appellent avec limit=500 (likes self, liste admin des users). */
export const LEGACY_MAX_LIMIT = 500;
