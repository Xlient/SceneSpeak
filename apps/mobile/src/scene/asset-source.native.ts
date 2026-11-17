import { ASSET_MODULES } from "./asset-map.generated";

export const hasAsset = (catalogUrl: string): boolean => ASSET_MODULES[catalogUrl] !== undefined;

/**
 * Native: R3F's polyfilled loaders take the Metro module id itself and copy the file locally.
 * Typed as string because that's what `useLoader` declares.
 */
export const loaderInput = (catalogUrl: string): string => {
  const module = ASSET_MODULES[catalogUrl];
  if (module === undefined) throw new Error(`No bundled model for ${catalogUrl}`);
  return module as unknown as string;
};
