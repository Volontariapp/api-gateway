import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SearchEventsRequestDTO } from '../../../../modules/event/dto/request/search-events.request.dto.js';

describe('SearchEventsRequestDTO (Unit)', () => {
  it('should relay a valid endAtFrom in toQuery', async () => {
    const dto = plainToInstance(SearchEventsRequestDTO, { endAtFrom: '2023-01-01T00:00:00Z' });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.toQuery().endAtFrom).toBe('2023-01-01T00:00:00Z');
  });

  it('should leave endAtFrom undefined in toQuery when absent', async () => {
    const dto = plainToInstance(SearchEventsRequestDTO, {});

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.toQuery().endAtFrom).toBeUndefined();
  });

  it('should reject an endAtFrom that is not an ISO 8601 date', async () => {
    const dto = plainToInstance(SearchEventsRequestDTO, { endAtFrom: 'pas-une-date' });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'endAtFrom')).toBe(true);
  });
});
