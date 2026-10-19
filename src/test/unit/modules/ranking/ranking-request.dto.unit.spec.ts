import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  GetRankingEventsRequestDTO,
  RecordEventFeedbackRequestDTO,
  RequestRankingRefreshRequestDTO,
  UpdateUserLocationRequestDTO,
} from '../../../../modules/ranking/dto/request/index.js';
import { RANKED_EVENT_ID_1 } from '../../../helpers/constants/ranking-test.constants.js';

const passes = (count: number) =>
  Array.from({ length: count }, () => ({ eventId: RANKED_EVENT_ID_1, action: 'PASS' }));

describe('Ranking request DTOs (Unit)', () => {
  it('should parse the query limit and cap it at 50', async () => {
    const dto = plainToInstance(GetRankingEventsRequestDTO, { cursor: 'abc', limit: '500' });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.toQuery()).toEqual({ cursor: 'abc', limit: 50 });
  });

  it('should default the cursor and the limit', () => {
    expect(plainToInstance(GetRankingEventsRequestDTO, {}).toQuery()).toEqual({
      cursor: '',
      limit: 20,
    });
  });

  it('should reject a limit below 1', async () => {
    const dto = plainToInstance(GetRankingEventsRequestDTO, { limit: '0' });

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('should reject an unknown list kind', async () => {
    const dto = plainToInstance(RequestRankingRefreshRequestDTO, { listKind: 'USER' });

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('should reject a position out of range', async () => {
    const dto = plainToInstance(UpdateUserLocationRequestDTO, { lat: 91, lng: 2 });

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('should accept 50 PASS and reject 51', async () => {
    const fifty = plainToInstance(RecordEventFeedbackRequestDTO, { items: passes(50) });
    const fiftyOne = plainToInstance(RecordEventFeedbackRequestDTO, { items: passes(51) });

    expect(await validate(fifty)).toHaveLength(0);
    expect(await validate(fiftyOne)).not.toHaveLength(0);
  });

  it('should reject an action other than PASS and an event id that is not a UUID', async () => {
    const dto = plainToInstance(RecordEventFeedbackRequestDTO, {
      items: [{ eventId: 'not-a-uuid', action: 'LIKE' }],
    });

    const [error] = await validate(dto);

    expect(error.property).toBe('items');
  });
});
