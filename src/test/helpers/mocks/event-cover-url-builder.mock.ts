import type { EventCoverUrlBuilder } from '../../../modules/event/dto/common/event-cover-url.builder.js';

export const EVENT_COVER_URL_BASE = 'https://cdn.test/event-cover';

export class EventCoverUrlBuilderMock implements EventCoverUrlBuilder {
  forEventCover(fileId?: string): string | undefined {
    return fileId === undefined ? undefined : `${EVENT_COVER_URL_BASE}/${fileId}.webp`;
  }
}

export class EmptyEventCoverUrlBuilderMock implements EventCoverUrlBuilder {
  forEventCover(_fileId?: string): string | undefined {
    return undefined;
  }
}
