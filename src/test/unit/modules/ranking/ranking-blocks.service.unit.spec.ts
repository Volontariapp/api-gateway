import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Metadata } from '@grpc/grpc-js';
import { of } from 'rxjs';
import {
  RELATIONSHIP_QUERY_SERVICE_NAME,
  type RelationshipQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { createMock } from '@volontariapp/testing';
import type { WithMetadata } from '../../../../common/types/grpc.types.js';
import { RankingBlocksService } from '../../../../modules/ranking/services/ranking-blocks.service.js';
import { MockServicesClientGrpc } from '../../../helpers/mocks/services-client-grpc.mock.js';
import { IdsPageFactory } from '../../../helpers/factories/ids-page.factory.js';

describe('RankingBlocksService (Unit)', () => {
  let relationshipQuery: jest.Mocked<WithMetadata<RelationshipQueryServiceClient>>;
  let service: RankingBlocksService;
  const metadata = new Metadata();

  beforeEach(() => {
    relationshipQuery = createMock<WithMetadata<RelationshipQueryServiceClient>>();
    service = new RankingBlocksService(
      new MockServicesClientGrpc({ [RELATIONSHIP_QUERY_SERVICE_NAME]: relationshipQuery }),
    );
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should read every page of both block sets by pages of 100', async () => {
    const myBlocksSpy = jest
      .spyOn(relationshipQuery, 'getMyBlocks')
      .mockImplementation(({ pagination }) =>
        of(IdsPageFactory.createPage(250, pagination?.page ?? 1, pagination?.limit ?? 100)),
      );
    const whoBlockedMeSpy = jest
      .spyOn(relationshipQuery, 'getWhoBlockedMe')
      .mockImplementation(({ pagination }) =>
        of(IdsPageFactory.createPage(101, pagination?.page ?? 1, pagination?.limit ?? 100)),
      );

    const hidden = await service.hiddenUserIds(metadata);

    expect(myBlocksSpy).toHaveBeenCalledTimes(3);
    expect(whoBlockedMeSpy).toHaveBeenCalledTimes(2);
    expect(myBlocksSpy).toHaveBeenNthCalledWith(
      3,
      { pagination: { page: 3, limit: 100 } },
      metadata,
    );
    expect(hidden).toEqual(new Set(IdsPageFactory.createIds(250)));
  });

  it('should merge both sets without duplicates', async () => {
    jest
      .spyOn(relationshipQuery, 'getMyBlocks')
      .mockReturnValue(of({ ids: ['a', 'b'], pagination: undefined }));
    jest
      .spyOn(relationshipQuery, 'getWhoBlockedMe')
      .mockReturnValue(of({ ids: ['b', 'c'], pagination: undefined }));

    await expect(service.hiddenUserIds(metadata)).resolves.toEqual(new Set(['a', 'b', 'c']));
  });
});
