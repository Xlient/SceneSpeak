import { Asset } from "expo-asset";
import { ASSET_MODULES } from "./asset-map.generated";

export const hasAsset = (catalogUrl: string): boolean => ASSET_MODULES[catalogUrl] !== undefined;

/** Web: the bundled file's URL, which GLTFLoader fetches. */
export const loaderInput = (catalogUrl: string): string => {
  const module = ASSET_MODULES[catalogUrl];
  if (module === undefined) throw new Error(`No bundled model for ${catalogUrl}`);
  return Asset.fromModule(module).uri;
};
