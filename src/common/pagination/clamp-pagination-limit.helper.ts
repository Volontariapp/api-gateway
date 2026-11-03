/** Une limite superieure au plafond est ramenee au plafond, jamais rejetee. */
export function clampPaginationLimit(limit: number, maxLimit: number): number {
  return Math.min(limit, maxLimit);
}
