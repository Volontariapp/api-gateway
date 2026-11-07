import { EventState, GrpcDateMapper, type Event } from '@volontariapp/contracts-nest';
import { AppConfigService } from '../../../config/app-config.service.js';
import { CustomConfig, ExtendedMSURLsConfig } from '../../../config/base-config.js';
import { EventFactory } from './event.factory.js';

const MINUTE_MS = 60 * 1000;

/** Fixed clock of the live sharing tests (jest fake timers are set to it). */
export const LIVE_NOW = new Date('2026-11-07T12:00:00.000Z');

export const LIVE_EVENT_ID = '123e4567-e89b-42d3-a456-426614174000';
export const LIVE_ORGANIZER_ID = '223e4567-e89b-42d3-a456-426614174000';
export const LIVE_CALLER_ID = '323e4567-e89b-42d3-a456-426614174000';
export const LIVE_EVENT_LATITUDE = 48.8566;
export const LIVE_EVENT_LONGITUDE = 2.3522;
export const LIVE_WS_URL = 'ws-service:3000';

export class LiveSharingFactory {
  /** Instant at `minutes` from `LIVE_NOW`. */
  static at(minutes: number): Date {
    return new Date(LIVE_NOW.getTime() + minutes * MINUTE_MS);
  }

  /**
   * Event that is running at `LIVE_NOW`: started 30 min ago, ends in 90 min, published, organized by
   * `LIVE_ORGANIZER_ID`. Dates are given as minutes from `LIVE_NOW`.
   */
  static createEvent(
    overrides: Partial<Omit<Event, 'startAt' | 'endAt'>> & {
      startInMinutes?: number;
      endInMinutes?: number;
    } = {},
  ): Event {
    const { startInMinutes = -30, endInMinutes = 90, ...rest } = overrides;
    return EventFactory.createEvent({
      id: LIVE_EVENT_ID,
      organizerId: LIVE_ORGANIZER_ID,
      state: EventState.EVENT_STATE_IN_PROGRESS,
      location: { latitude: LIVE_EVENT_LATITUDE, longitude: LIVE_EVENT_LONGITUDE },
      ...rest,
      startAt: GrpcDateMapper.toTimestamp(LiveSharingFactory.at(startInMinutes)),
      endAt: GrpcDateMapper.toTimestamp(LiveSharingFactory.at(endInMinutes)),
    });
  }

  static createConfigService(msWsUrl: string = LIVE_WS_URL): AppConfigService {
    const config = new CustomConfig();
    config.microServices = Object.assign(new ExtendedMSURLsConfig(), { msWsUrl });
    return new AppConfigService(config);
  }
}
