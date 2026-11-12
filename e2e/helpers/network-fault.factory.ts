/** Names of the toxics currently set, by proxy name. */
export type ToxicFactoryInput = Readonly<Record<string, readonly string[]>>;

/** Body of `GET /proxies` of Toxiproxy: an object keyed by proxy name. */
export const proxyListingFactory = (
  proxyNames: readonly string[],
): Record<string, { name: string; enabled: boolean }> =>
  Object.fromEntries(proxyNames.map((name) => [name, { name, enabled: true }]));
