import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GetActiveUserLocationsRequestDTO } from '../../../../modules/ranking/dto/request/index.js';

const check = async (plain: Record<string, unknown>) =>
  validate(plainToInstance(GetActiveUserLocationsRequestDTO, plain));

describe('GetActiveUserLocationsRequestDTO (Unit)', () => {
  it('should accept an empty query and ask for the server default', async () => {
    expect(await check({})).toHaveLength(0);
    expect(plainToInstance(GetActiveUserLocationsRequestDTO, {}).toQuery()).toEqual({
      maxAgeMinutes: 0,
    });
  });

  it('should read the window from the query string', async () => {
    const dto = plainToInstance(GetActiveUserLocationsRequestDTO, { maxAgeMinutes: '45' });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.toQuery()).toEqual({ maxAgeMinutes: 45 });
  });

  it.each([-1, 1441, 1.5])('should refuse a window of %s minutes', async (value) => {
    expect(await check({ maxAgeMinutes: value })).not.toHaveLength(0);
  });

  it('should refuse a non numeric window', async () => {
    expect(await check({ maxAgeMinutes: 'soon' })).not.toHaveLength(0);
  });
});
