import { expect } from '@jest/globals';

/** Third argument of a gRPC read wrapped by withReadDeadline: grpc-js CallOptions with a deadline. */
export const READ_DEADLINE_OPTIONS = expect.objectContaining({ deadline: expect.any(Number) });
