import { randomUUID } from 'node:crypto';
import { TagsNames } from '@volontariapp/shared';
import { EventType } from '@volontariapp/contracts-nest';
import type {
  CreateEventRequest,
  CreateTagRequest,
  AddRequirementRequest,
} from '@volontariapp/contracts';

export const createEventRequestFactory = (
  overrides?: Partial<CreateEventRequest>,
): CreateEventRequest => ({
  title: `Event-${randomUUID()}`,
  description: 'Test Description',
  startAt: new Date(Date.now() + 86400000),
  endAt: new Date(Date.now() + 172800000),
  localisationName: 'Paris',
  maxParticipants: 100,
  type: EventType.EVENT_TYPE_SOCIAL,
  awardedImpactScore: 50,
  tagIds: [],
  ...overrides,
});

export const createTagRequestFactory = (
  overrides?: Partial<CreateTagRequest>,
): CreateTagRequest => ({
  name: `Tag-${randomUUID()}`,
  slug: `slug-${randomUUID()}`,
  balise: TagsNames.ECOLOGIE,
  ...overrides,
});

export const addRequirementRequestFactory = (
  overrides?: Partial<AddRequirementRequest>,
): AddRequirementRequest => ({
  name: 'Volunteer Experience',
  description: 'Previous experience required',
  neededQuantity: 5,
  ...overrides,
});
