import type { Response } from 'supertest';
import { TestClient } from './test-client.helper.js';

export class DebugTestClient extends TestClient {
  async getDebug(url: string): Promise<Response> {
    const res = await super.get(url);
    console.log(`GET ${url} -> ${res.status.toString()}`, res.body);
    return res;
  }
}
