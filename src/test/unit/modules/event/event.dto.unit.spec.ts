import { jest } from '@jest/globals';
import { CoverStatus } from '@volontariapp/contracts-nest';
import { EventDTO } from '../../../../modules/event/dto/common/event.dto.js';
import {
  EmptyEventCoverUrlBuilderMock,
  EVENT_COVER_URL_BASE,
  EventCoverUrlBuilderMock,
} from '../../../helpers/mocks/event-cover-url-builder.mock.js';
import { EVENT_COVER_FILE_ID, EventFactory } from '../../../helpers/factories/event.factory.js';

/** What the client receives: undefined fields are dropped by JSON serialization. */
const serialized = (value: unknown): Record<string, unknown> =>
  JSON.parse(JSON.stringify(value)) as Record<string, unknown>;

describe('EventDTO.fromResponse (Unit)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(['COVER_STATUS_READY', CoverStatus.COVER_STATUS_READY] as const)(
    'should expose coverUrl when the cover status is READY (%s)',
    (status) => {
      const dto = EventDTO.fromResponse(
        EventFactory.createWireEvent(status, EVENT_COVER_FILE_ID),
        new EventCoverUrlBuilderMock(),
      );

      expect(dto.coverStatus).toBe('READY');
      expect(dto.coverFileId).toBe(EVENT_COVER_FILE_ID);
      expect(dto.coverUrl).toBe(`${EVENT_COVER_URL_BASE}/${EVENT_COVER_FILE_ID}.webp`);
    },
  );

  it.each([
    ['COVER_STATUS_PENDING', 'PENDING'],
    [CoverStatus.COVER_STATUS_PENDING, 'PENDING'],
    ['COVER_STATUS_REJECTED', 'REJECTED'],
    [CoverStatus.COVER_STATUS_REJECTED, 'REJECTED'],
    ['COVER_STATUS_NONE', 'NONE'],
    [CoverStatus.COVER_STATUS_NONE, 'NONE'],
    ['COVER_STATUS_UNSPECIFIED', 'NONE'],
    ['UNRECOGNIZED', 'NONE'],
  ] as const)('should map the cover status %s to %s without building a url', (status, expected) => {
    const urls = new EventCoverUrlBuilderMock();
    const buildSpy = jest.spyOn(urls, 'forEventCover');

    const dto = EventDTO.fromResponse(
      EventFactory.createWireEvent(status, EVENT_COVER_FILE_ID),
      urls,
    );

    expect(dto.coverStatus).toBe(expected);
    expect(buildSpy).not.toHaveBeenCalled();
    expect(serialized(dto)).not.toHaveProperty('coverUrl');
  });

  it('should omit coverUrl when the url cannot be built', () => {
    const dto = EventDTO.fromResponse(
      EventFactory.createWireEvent('COVER_STATUS_READY', EVENT_COVER_FILE_ID),
      new EmptyEventCoverUrlBuilderMock(),
    );

    expect(dto.coverStatus).toBe('READY');
    expect(serialized(dto)).not.toHaveProperty('coverUrl');
  });

  it('should omit coverUrl when READY but no file id is set', () => {
    const dto = EventDTO.fromResponse(
      EventFactory.createWireEvent('COVER_STATUS_READY'),
      new EventCoverUrlBuilderMock(),
    );

    expect(serialized(dto)).not.toHaveProperty('coverUrl');
  });

  it('should keep the other event fields and convert the dates', () => {
    const dto = EventDTO.fromResponse(
      EventFactory.createWireEvent('COVER_STATUS_NONE'),
      new EventCoverUrlBuilderMock(),
    );

    expect(dto.title).toBe('Maraude du samedi');
    expect(dto.startAt).toEqual(new Date(1_790_000_000 * 1000));
    expect(dto.endAt).toEqual(new Date(1_790_003_600 * 1000));
  });
});
