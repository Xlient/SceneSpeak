import * as THREE from "three";
import type { Animation } from "../schemas";
import { resolveClipName } from "./clip-resolver";
import { type LoadedModel, loadModel, scaleToHeight } from "./model-loader";
import { createChibi } from "./chibi";
import { POSE_BONES, type PoseBone, proceduralPose } from "./procedural-pose";
import { createRoom } from "./rooms-3d";
import type { CameraView, SceneManifest, Vec3 } from "./scene-manifest";

export type SceneLoadStatus = "loading" | "ready";

export interface SceneLoadOptions {
  /** Hide the back wall and clear the background so a backdrop layer shows through. */
  transparentBack?: boolean;
}

export interface ScenePlayerOptions {
  canvas: HTMLCanvasElement;
  reducedMotion?: boolean;
}

export interface ScenePlayer {
  load(manifest: SceneManifest, options?: SceneLoadOptions): Promise<SceneLoadStatus>;
  play(animation: Animation): void;
  dispose(): void;
}

interface RigBone {
  bone: THREE.Object3D;
  bind: THREE.Euler;
}

const CROSSFADE_SECONDS = 0.3;

const DEFAULT_VIEW: CameraView = { position: [0, 1.6, 3.2], target: [0, 1.2, -1] };
const SKY = 0xcfe3f0;
const CHIBI_ROTATION = Math.PI;

const findRig = (root: THREE.Object3D): Map<PoseBone, RigBone> => {
  const rig = new Map<PoseBone, RigBone>();
  for (const name of POSE_BONES) {
    const bone = root.getObjectByName(name);
    if (bone) rig.set(name, { bone, bind: bone.rotation.clone() });
  }
  return rig;
};

export const createScenePlayer = ({ canvas, reducedMotion = false }: ScenePlayerOptions): ScenePlayer => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a66, 2));
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(3, 5, 4);
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 50);
  const setView = (view: CameraView = DEFAULT_VIEW) => {
    camera.position.set(...view.position);
    camera.lookAt(...view.target);
  };
  setView();

  const timer = new THREE.Timer();
  let content = new THREE.Group();
  scene.add(content);
  let mixer: THREE.AnimationMixer | undefined;
  let clips: THREE.AnimationClip[] = [];
  let currentAction: THREE.AnimationAction | undefined;
  let rig = new Map<PoseBone, RigBone>();
  let currentAnimation: Animation = "idle";
  let useProcedural = false;
  let frame = 0;

  const resize = () => {
    const { clientWidth: width, clientHeight: height } = canvas;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  const applyProceduralPose = (time: number) => {
    const pose = proceduralPose(currentAnimation, reducedMotion ? 0 : time);
    for (const [name, { bone, bind }] of rig) {
      const [x, y, z] = pose[name] ?? [0, 0, 0];
      bone.rotation.set(bind.x + x, bind.y + y, bind.z + z);
    }
  };

  const tick = (now: number) => {
    timer.update(now);
    const delta = timer.getDelta();
    if (useProcedural) applyProceduralPose(timer.getElapsed());
    else if (!reducedMotion) mixer?.update(delta);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  const play = (animation: Animation) => {
    currentAnimation = animation;
    if (!mixer) {
      useProcedural = rig.size > 0;
      return;
    }
    const name = resolveClipName(animation, clips.map((clip) => clip.name));
    const clip = name ? THREE.AnimationClip.findByName(clips, name) : undefined;
    useProcedural = !clip && rig.size > 0;
    if (!clip) {
      currentAction?.stop();
      currentAction = undefined;
      return;
    }
    const next = mixer.clipAction(clip);
    if (next === currentAction) return;
    next.reset().play();
    if (currentAction) next.crossFadeFrom(currentAction, CROSSFADE_SECONDS, false);
    currentAction = next;
  };

  const place = (root: THREE.Object3D, position: Vec3, rotationY = 0, scale = 1) => {
    root.position.set(...position);
    root.rotation.y = rotationY;
    root.scale.multiplyScalar(scale);
    content.add(root);
  };

  const reset = () => {
    scene.remove(content);
    disposeObject(content);
    content = new THREE.Group();
    scene.add(content);
    mixer?.stopAllAction();
    mixer = undefined;
    clips = [];
    currentAction = undefined;
    rig = new Map();
    useProcedural = false;
  };

  const loadOptional = async (url: string, materials: SceneManifest["props"][number]["materials"]) => {
    try {
      return await loadModel(url, materials);
    } catch (error) {
      console.warn(`Model unavailable, skipping: ${url}`, error);
      return undefined;
    }
  };

  let loadId = 0;
  const load = async (manifest: SceneManifest, options: SceneLoadOptions = {}): Promise<SceneLoadStatus> => {
    const id = ++loadId;
    const { character } = manifest;
    // Repeated props (two counters, two ovens) load once; each placement is a clone sharing geometry and materials.
    const shared = new Map<string, Promise<LoadedModel | undefined>>();
    const loadShared = (prop: SceneManifest["props"][number]) => {
      let pending = shared.get(prop.url);
      if (!pending) {
        pending = loadOptional(prop.url, prop.materials);
        shared.set(prop.url, pending);
      }
      return pending;
    };
    const [model, animationFiles, props] = await Promise.all([
      character.model ? loadOptional(character.model.url, character.model.materials) : Promise.resolve(undefined),
      Promise.all(manifest.animationUrls.map((url) => loadOptional(url, undefined))),
      Promise.all(manifest.props.map(async (prop) => ({ prop, model: await loadShared(prop) }))),
    ]);
    if (id !== loadId) return "ready";
    reset();
    setView(manifest.camera);
    scene.background = options.transparentBack ? null : new THREE.Color(SKY);
    content.add(createRoom(manifest.room, { backWall: !options.transparentBack }));
    for (const { prop, model: loaded } of props) {
      if (!loaded) continue;
      place(loaded.root.clone(), prop.position, prop.rotationY, prop.scale);
    }
    if (model && character.model) {
      scaleToHeight(model.root, character.model.height);
      place(model.root, character.position, character.model.rotationY);
      mixer = new THREE.AnimationMixer(model.root);
      clips = [...model.animations, ...animationFiles.flatMap((file: LoadedModel | undefined) => file?.animations ?? [])];
      rig = findRig(model.root);
    } else {
      const chibi = createChibi(character.look);
      place(chibi, character.position, CHIBI_ROTATION);
      rig = findRig(chibi);
    }
    play(currentAnimation);
    return "ready";
  };

  return {
    load,
    play,
    dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      reset();
      renderer.dispose();
    },
  };
};

const disposeObject = (root: THREE.Object3D) => {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials: THREE.Material[] = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) material.dispose();
  });
};
