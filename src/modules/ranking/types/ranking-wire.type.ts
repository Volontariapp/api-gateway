import type {
  RankingItem,
  RankingPage,
  RankingReason,
  RankingSource,
} from '@volontariapp/contracts-nest';

/**
 * Enums as the gateway gRPC client really decodes them: `getGrpcOptions` loads the protos with
 * `enums: String` (contracts-nest, grpc.helpers.ts), so a value arrives as its name. The generated
 * types declare numbers; both forms are accepted.
 */
export type RankingReasonOnWire = RankingReason | keyof typeof RankingReason;

export type RankingSourceOnWire = RankingSource | keyof typeof RankingSource;

export type RankingItemOnWire = Omit<RankingItem, 'reasons'> & { reasons: RankingReasonOnWire[] };

export type RankingPageOnWire = Omit<RankingPage, 'items' | 'source'> & {
  items: RankingItemOnWire[];
  source: RankingSourceOnWire;
};
