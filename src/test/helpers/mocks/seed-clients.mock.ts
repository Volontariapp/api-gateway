import { jest } from '@jest/globals';
import { of } from 'rxjs';
import type { Metadata } from '@grpc/grpc-js';
import { createMock } from '@volontariapp/testing';
import {
  EVENT_COMMAND_SERVICE_NAME,
  PARTICIPATION_COMMAND_SERVICE_NAME,
  RELATIONSHIP_COMMAND_SERVICE_NAME,
  type EventCommandServiceClient,
  type ParticipationCommandServiceClient,
  type RelationshipCommandServiceClient,
} from '@volontariapp/contracts-nest';
import type { WithMetadata } from '../../../common/types/grpc.types.js';
import { MockServicesClientGrpc } from './services-client-grpc.mock.js';

/** Clients gRPC du seed d'interactions, dont tous les appels reussissent par defaut. */
export function createSeedClientsMock() {
  const participation = createMock<WithMetadata<ParticipationCommandServiceClient>>();
  const relationship = createMock<WithMetadata<RelationshipCommandServiceClient>>();
  const eventCommand = createMock<WithMetadata<EventCommandServiceClient>>();

  const spies = {
    register: jest
      .spyOn(participation, 'postUserParticipateEvent')
      .mockImplementation(() => of({})),
    wish: jest.spyOn(participation, 'postUserWishEvent').mockImplementation(() => of({})),
    attendance: jest.spyOn(participation, 'setEventAttendance').mockImplementation(() => of({})),
    follow: jest.spyOn(relationship, 'postFollowUser').mockImplementation(() => of({})),
    changeState: jest
      .spyOn(eventCommand, 'changeEventState')
      .mockImplementation(() => of({ event: undefined })),
  };

  return {
    spies,
    socialClient: new MockServicesClientGrpc({
      [PARTICIPATION_COMMAND_SERVICE_NAME]: participation,
      [RELATIONSHIP_COMMAND_SERVICE_NAME]: relationship,
    }),
    eventClient: new MockServicesClientGrpc({ [EVENT_COMMAND_SERVICE_NAME]: eventCommand }),
  };
}

/** Metadata portant l'identifiant de l'utilisateur au nom duquel l'appel est signe. */
export const SEED_ACTOR_HEADER = 'x-test-actor';

export const getActorMetadata = (base: Metadata, userId: string): Promise<Metadata> => {
  const md = base.clone();
  md.set(SEED_ACTOR_HEADER, userId);
  return Promise.resolve(md);
};
