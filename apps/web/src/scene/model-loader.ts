import * as THREE from "three";
import type { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import type { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export interface LoadedModel {
  root: THREE.Object3D;
  animations: THREE.AnimationClip[];
}

// KayKit props share one texture atlas; the file cache fetches it once.
THREE.Cache.enabled = true;

// Loaders are split out: FBX is only used by local dev models, so production never downloads it.
let gltfLoader: Promise<GLTFLoader> | undefined;
let fbxLoader: Promise<FBXLoader> | undefined;
const getGltfLoader = () => (gltfLoader ??= import("three/addons/loaders/GLTFLoader.js").then((m) => new m.GLTFLoader()));
const getFbxLoader = () => (fbxLoader ??= import("three/addons/loaders/FBXLoader.js").then((m) => new m.FBXLoader()));
const textureLoader = new THREE.TextureLoader();

const loadTexture = async (url: string): Promise<THREE.Texture> => {
  const texture = await textureLoader.loadAsync(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Mipmaps blend the black transparent pixels of decals into a dark smear at a distance.
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
};

// FBX exports often point at the author's local texture paths, so maps are reassigned by material name.
const applyMaterials = async (
  root: THREE.Object3D,
  textures: Readonly<Record<string, string>>,
  colors: Readonly<Record<string, number>>,
) => {
  const entries = await Promise.all(
    Object.entries(textures).map(async ([name, url]) => [name, await loadTexture(url)] as const),
  );
  const byName = new Map(entries);
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials: THREE.Material[] = Array.isArray(object.material) ? object.material : [object.material];
    const replaced = materials.map((material) => {
      const color = colors[material.name];
      if (color !== undefined) {
        material.dispose();
        return new THREE.MeshLambertMaterial({ name: material.name, color });
      }
      const map = byName.get(material.name);
      if (!map) return material;
      material.dispose();
      // alphaTest cuts out transparent decals (e.g. face textures) and leaves opaque atlases unchanged.
      return new THREE.MeshLambertMaterial({ name: material.name, map, alphaTest: 0.5 });
    });
    object.material = Array.isArray(object.material) ? replaced : (replaced[0] ?? object.material);
  });
};

export interface MaterialOverrides {
  textures?: Readonly<Record<string, string>>;
  colors?: Readonly<Record<string, number>>;
}

export const loadModel = async (url: string, overrides: MaterialOverrides = {}): Promise<LoadedModel> => {
  const model = url.toLowerCase().endsWith(".fbx")
    ? await (await getFbxLoader()).loadAsync(url).then((group) => ({ root: group as THREE.Object3D, animations: group.animations }))
    : await (await getGltfLoader()).loadAsync(url).then((gltf) => ({ root: gltf.scene as THREE.Object3D, animations: gltf.animations }));
  await applyMaterials(model.root, overrides.textures ?? {}, overrides.colors ?? {});
  return model;
};

export const scaleToHeight = (root: THREE.Object3D, height: number) => {
  root.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  if (size.y > 0) root.scale.multiplyScalar(height / size.y);
};
