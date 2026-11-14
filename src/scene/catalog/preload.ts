import type { Catalog } from "./catalog-types";
import { KAYKIT_DIR, KAYKIT_TEXTURE } from "./props";

/** Every public file the catalog's props need (glTF, its .bin, the shared atlas); local-only models are skipped. */
export const catalogAssetUrls = (catalog: Catalog): string[] => {
  const urls = new Set<string>();
  for (const prop of catalog.props) {
    if (prop.local || !prop.url.endsWith(".gltf")) continue;
    urls.add(prop.url);
    urls.add(prop.url.replace(/\.gltf$/, ".bin"));
    if (prop.url.startsWith(`${KAYKIT_DIR}/`)) urls.add(KAYKIT_TEXTURE);
  }
  return [...urls];
};

const prefetched = new Set<string>();

/** Low-priority fetches into the HTTP cache, so a generated scene's models are already local when it opens. */
export const prefetchUrls = (urls: readonly string[], doc: Document = document) => {
  for (const url of urls) {
    if (prefetched.has(url)) continue;
    prefetched.add(url);
    const link = doc.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    doc.head.append(link);
  }
};
