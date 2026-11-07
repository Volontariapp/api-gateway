import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { StopLiveSharingQueryDTO } from '../../../../modules/live/dto/common/stop-live-sharing-query.dto.js';

describe('StopLiveSharingQueryDTO (Unit)', () => {
  const parse = (query: Record<string, unknown>) => plainToInstance(StopLiveSharingQueryDTO, query);

  it('should default to STOPPED without a reason', async () => {
    const dto = parse({});

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.toReason()).toBe('STOPPED');
  });

  it.each(['ARRIVED', 'STOPPED', 'LEFT'])('should accept the reason %s', async (reason) => {
    const dto = parse({ reason });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.toReason()).toBe(reason);
  });

  it.each(['EVENT_ENDED', 'REVOKED', 'EXPIRED', 'arrived', '', 'ARRIVED,LEFT'])(
    'should refuse the reason "%s"',
    async (reason) => {
      const errors = await validate(parse({ reason }));

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('reason');
    },
  );

  it('should refuse a reason given twice', async () => {
    const errors = await validate(parse({ reason: ['ARRIVED', 'LEFT'] }));

    expect(errors).toHaveLength(1);
  });
});
