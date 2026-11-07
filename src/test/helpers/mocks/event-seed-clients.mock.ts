import { jest } from '@jest/globals';
import { of } from 'rxjs';
import { createMock } from '@volontariapp/testing';
import {
  EVENT_COMMAND_SERVICE_NAME,
  PARTICIPATION_COMMAND_SERVICE_NAME,
  type EventCommandServiceClient,
  type ParticipationCommandServiceClient,
} from '@volontariapp/contracts-nest';
import type { WithMetadata } from '../../../common/types/grpc.types.js';
import type { MediaSeedService } from '../../../modules/system/services/media-seed.service.js';
import { EventFactory } from '../factories/event.factory.js';
import { MockServicesClientGrpc } from './services-client-grpc.mock.js';

/** Clients gRPC du seed d'evenements : createEvent renvoie des identifiants sequentiels. */
export function createEventSeedClientsMock() {
  const eventCommand = createMock<WithMetadata<EventCommandServiceClient>>();
  const participation = createMock<WithMetadata<ParticipationCommandServiceClient>>();
  const mediaSeedService = createMock<MediaSeedService>();

  let created = 0;
  const spies = {
    createEvent: jest.spyOn(eventCommand, 'createEvent').mockImplementation(() => {
      created++;
      return of({ event: EventFactory.createEvent({ id: `live-${String(created)}` }) });
    }),
    changeState: jest
      .spyOn(eventCommand, 'changeEventState')
      .mockImplementation(() => of({ event: undefined })),
    requirements: jest
      .spyOn(eventCommand, 'manageRequirements')
      .mockImplementation(() => of({ success: true, message: '' })),
    eventNode: jest.spyOn(participation, 'createEventNode').mockImplementation(() => of({})),
    organizerLink: jest.spyOn(participation, 'postUserEvent').mockImplementation(() => of({})),
    image: jest.spyOn(mediaSeedService, 'getOrUploadImage').mockResolvedValue(undefined),
  };

  return {
    spies,
    mediaSeedService,
    eventClient: new MockServicesClientGrpc({ [EVENT_COMMAND_SERVICE_NAME]: eventCommand }),
    socialClient: new MockServicesClientGrpc({
      [PARTICIPATION_COMMAND_SERVICE_NAME]: participation,
    }),
  };
}
