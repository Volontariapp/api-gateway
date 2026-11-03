import type { TestClient } from '../helpers/test-client.helper.js';
import type { ListUsersResponseDTO } from '../../src/modules/user/dto/response/index.js';

const ADMIN_LIST_PAGE_SIZE = 100;
const ADMIN_LIST_MAX_PAGES = 20;

/**
 * Parcourt la liste admin des utilisateurs page par page jusqu'a trouver l'identifiant.
 *
 * GET /users sans pagination ne renvoie plus toute la table (defaut ms-user: page 1, limit 10) :
 * un utilisateur fraichement cree n'est pas garanti d'etre dans la premiere page. S'arrete sur
 * une page vide. Le total renvoye par ms-user n'est pas utilise : il vaut aujourd'hui la taille
 * de la page filtree, pas le nombre total d'utilisateurs.
 */
export async function isUserInAdminList(client: TestClient, userId: string): Promise<boolean> {
  for (let page = 1; page <= ADMIN_LIST_MAX_PAGES; page += 1) {
    const res = await client
      .get(`/api/v1/users?page=${String(page)}&limit=${String(ADMIN_LIST_PAGE_SIZE)}`)
      .expect(200);
    const { users } = res.body as ListUsersResponseDTO;
    if (users.some((user) => user.id === userId)) {
      return true;
    }
    if (users.length === 0) {
      return false;
    }
  }
  return false;
}
