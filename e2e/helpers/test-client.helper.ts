/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getAuthHeader } from './auth-helper.js';

export class TestClient {
  private authHeader: Record<string, string> | undefined;
  private readonly baseUrl: string | undefined;

  constructor(private readonly app: INestApplication) {
    this.baseUrl = process.env.E2E_TARGET_URL;
  }

  async login(user: { id: string; role: string }) {
    this.authHeader = await getAuthHeader(this.app, user);
    return this;
  }

  withToken(token: string): TestClient {
    const newClient = new TestClient(this.app);
    newClient.authHeader = { Authorization: `Bearer ${token}` };
    return newClient;
  }

  setAuthHeader(header: Record<string, string>): TestClient {
    const newClient = new TestClient(this.app);
    newClient.authHeader = header;
    return newClient;
  }

  private getRequestTarget() {
    if (this.baseUrl) {
      return this.baseUrl;
    }
    return this.app.getHttpServer();
  }

  get(url: string) {
    const req = request(this.getRequestTarget()).get(url);
    if (this.authHeader) {
      req.set(this.authHeader);
    }
    return req;
  }

  post(url: string) {
    const req = request(this.getRequestTarget()).post(url);
    if (this.authHeader) {
      req.set(this.authHeader);
    }
    return req;
  }

  patch(url: string) {
    const req = request(this.getRequestTarget()).patch(url);
    if (this.authHeader) {
      req.set(this.authHeader);
    }
    return req;
  }

  delete(url: string) {
    const req = request(this.getRequestTarget()).delete(url);
    if (this.authHeader) {
      req.set(this.authHeader);
    }
    return req;
  }
}

export function createTestClient(app: INestApplication) {
  return new TestClient(app);
}
