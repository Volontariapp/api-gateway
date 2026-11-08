import 'reflect-metadata';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Metadata } from '@grpc/grpc-js';
import { firstValueFrom, of } from 'rxjs';
import { RolesGuard, ROLES_KEY } from '@volontariapp/auth';
import {
  RANKING_QUERY_SERVICE_NAME,
  type RankingQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { UserRoles } from '@volontariapp/shared';
import { createMock } from '@volontariapp/testing';
import type { WithMetadata } from '../../../../common/types/grpc.types.js';
import { RankingAdminQueryController } from '../../../../modules/ranking/controllers/queries/ranking-admin.query-controller.js';
import { GetActiveUserLocationsRequestDTO } from '../../../../modules/ranking/dto/request/index.js';
import { MockServicesClientGrpc } from '../../../helpers/mocks/services-client-grpc.mock.js';

describe('RankingAdminQueryController (Unit)', () => {
  let queryService: jest.Mocked<WithMetadata<RankingQueryServiceClient>>;
  let controller: RankingAdminQueryController;
  const metadata = new Metadata();
  const req = { internalMetadata: metadata };

  beforeEach(() => {
    queryService = createMock<WithMetadata<RankingQueryServiceClient>>();
    controller = new RankingAdminQueryController(
      new MockServicesClientGrpc({ [RANKING_QUERY_SERVICE_NAME]: queryService }),
    );
    controller.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should forward the window with the internal metadata and return the cells only', async () => {
    const spy = jest.spyOn(queryService, 'getActiveUserLocations').mockReturnValue(
      of({
        cells: [
          { lat: 48.85, lng: 2.35 },
          { lat: 45.76, lng: 4.83 },
        ],
      }),
    );
    const request = Object.assign(new GetActiveUserLocationsRequestDTO(), { maxAgeMinutes: 15 });

    const response = await firstValueFrom(controller.getActiveLocations(request, req));

    expect(spy).toHaveBeenCalledWith({ maxAgeMinutes: 15 }, metadata);
    expect(response.cells).toEqual([
      { lat: 48.85, lng: 2.35 },
      { lat: 45.76, lng: 4.83 },
    ]);
    expect(Object.keys(response)).toEqual(['cells']);
  });

  it('should ask for the default window when none is given', async () => {
    const spy = jest
      .spyOn(queryService, 'getActiveUserLocations')
      .mockReturnValue(of({ cells: [] }));

    await firstValueFrom(
      controller.getActiveLocations(new GetActiveUserLocationsRequestDTO(), req),
    );

    expect(spy).toHaveBeenCalledWith({ maxAgeMinutes: 0 }, metadata);
  });

  describe('access control', () => {
    it('should require the ADMIN role on the handler', () => {
      const handler = Object.getOwnPropertyDescriptor(
        RankingAdminQueryController.prototype,
        'getActiveLocations',
      )?.value as object;
      const roles = Reflect.getMetadata(ROLES_KEY, handler) as string[];

      expect(roles).toEqual([UserRoles.ADMIN]);
    });

    it('should mount the roles guard on the controller, not only declare the role', () => {
      const guards = Reflect.getMetadata('__guards__', RankingAdminQueryController) as unknown[];

      expect(guards).toContain(RolesGuard);
    });
  });
});
