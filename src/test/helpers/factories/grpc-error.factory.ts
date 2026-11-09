import { GrpcStatus } from '@volontariapp/errors';

export type GrpcErrorLike = Error & { code: number; details: string };

/** Error as grpc-js hands it to the Nest client callback (status code + details, no JSON body). */
export const createGrpcErrorFactory = (
  code: number = GrpcStatus.DEADLINE_EXCEEDED,
  details: string = 'Deadline exceeded after 2.001s,remote_addr=10.0.0.1:3000',
): GrpcErrorLike => Object.assign(new Error(`${String(code)} ${details}`), { code, details });
