import type { Metadata } from '@grpc/grpc-js';
import type { Observable } from 'rxjs';

export type WithMetadata<T> = {
  [K in keyof T]: T[K] extends (request: infer R) => Observable<infer Res>
    ? (request: R, metadata?: Metadata) => Observable<Res>
    : T[K];
};
