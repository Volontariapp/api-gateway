import type { CallOptions, Metadata } from '@grpc/grpc-js';
import type { Observable } from 'rxjs';

/** Nest's ClientGrpc forwards every argument to grpc-js: (request, metadata, options, callback). */
export type WithMetadata<T> = {
  [K in keyof T]: T[K] extends (request: infer R) => Observable<infer Res>
    ? (request: R, metadata?: Metadata, options?: CallOptions) => Observable<Res>
    : T[K];
};
