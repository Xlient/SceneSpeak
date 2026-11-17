import { Suspense, useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";
import { AnimationClip, AnimationMixer, type AnimationAction, Box3, type Object3D, type PerspectiveCamera, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import type { Animation } from "@scenespeak/core/schemas";
import type { CharacterModel } from "@scenespeak/core/scene/catalog/catalog-types";
import { createChibi } from "@scenespeak/core/scene/chibi";
import { resolveClipName } from "@scenespeak/core/scene/clip-resolver";
import { createRoom } from "@scenespeak/core/scene/rooms-3d";
import type { PropPlacement, SceneManifest } from "@scenespeak/core/scene/scene-manifest";
import { color } from "../theme/tokens";
import { hasAsset, loaderInput } from "./asset-source";
import { paceRenderer } from "./pace-renderer";
import { Canvas, useFrame, useLoader, useThree } from "./r3f";
import { applyPose, findRig } from "./rig";

export interface SceneViewProps {
  manifest: SceneManifest;
  animation: Animation;
}

const CROSSFADE_SECONDS = 0.3;
const CHIBI_ROTATION = Math.PI;

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
};

const disposeTree = (root: Object3D) => {
  root.traverse((object) => {
    const mesh = object as Partial<{ geometry: { dispose(): void }; material: { dispose(): void } | { dispose(): void }[] }>;
    mesh.geometry?.dispose();
    for (const material of [mesh.material ?? []].flat()) material.dispose();
  });
};

const scaleToHeight = (root: Object3D, height: number) => {
  root.updateMatrixWorld(true);
  const size = new Box3().setFromObject(root).getSize(new Vector3());
  if (size.y > 0) root.scale.multiplyScalar(height / size.y);
};

const CameraView = ({ manifest }: { manifest: SceneManifest }) => {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  useEffect(() => {
    camera.fov = 40;
    camera.position.set(...manifest.camera.position);
    camera.lookAt(...manifest.camera.target);
    camera.updateProjectionMatrix();
  }, [camera, manifest.camera]);
  return null;
};

const Room = ({ manifest }: { manifest: SceneManifest }) => {
  const room = useMemo(() => createRoom(manifest.room, { backWall: true }), [manifest.room]);
  useEffect(() => () => disposeTree(room), [room]);
  return <primitive object={room} />;
};

// Repeated props (two counters) load once; each placement clones and shares geometry.
const Props = ({ props }: { props: readonly PropPlacement[] }) => {
  const placed = useMemo(() => props.filter((prop) => hasAsset(prop.url)), [props]);
  const urls = useMemo(() => [...new Set(placed.map((prop) => prop.url))], [placed]);
  const gltfs = useLoader(GLTFLoader, urls.map(loaderInput));
  const objects = useMemo(
    () =>
      placed.map((prop) => {
        const source = gltfs[urls.indexOf(prop.url)];
        const root = source ? source.scene.clone() : undefined;
        if (!root) return undefined;
        root.position.set(...prop.position);
        root.rotation.y = prop.rotationY ?? 0;
        root.scale.multiplyScalar(prop.scale ?? 1);
        return root;
      }),
    [gltfs, placed, urls],
  );
  return (
    <>
      {objects.map((object, index) => (object ? <primitive key={index} object={object} /> : null))}
    </>
  );
};

const Chibi = ({ manifest, animation, reducedMotion }: SceneViewProps & { reducedMotion: boolean }) => {
  const { look, position } = manifest.character;
  const chibi = useMemo(() => {
    const root = createChibi(look);
    root.position.set(...position);
    root.rotation.y = CHIBI_ROTATION;
    return root;
  }, [look, position]);
  const rig = useMemo(() => findRig(chibi), [chibi]);
  useEffect(() => () => disposeTree(chibi), [chibi]);
  useFrame(({ clock }) => applyPose(rig, animation, reducedMotion ? 0 : clock.elapsedTime));
  return <primitive object={chibi} />;
};

/** A rigged glTF character: plays the clip that matches `animation` (e.g. Idle_Talking_Loop for "talk"). */
const ModelCharacter = ({ model, manifest, animation, reducedMotion }: SceneViewProps & { model: CharacterModel; reducedMotion: boolean }) => {
  const gltf = useLoader(GLTFLoader, loaderInput(model.url));
  const root = useMemo(() => {
    const copy = cloneSkinned(gltf.scene);
    scaleToHeight(copy, model.height);
    copy.position.set(...manifest.character.position);
    copy.rotation.y = model.rotationY ?? 0;
    return copy;
  }, [gltf, model, manifest.character.position]);
  const mixer = useMemo(() => new AnimationMixer(root), [root]);
  const [current, setCurrent] = useState<AnimationAction>();

  useEffect(() => {
    const name = resolveClipName(animation, gltf.animations.map((clip) => clip.name));
    const clip = name ? AnimationClip.findByName(gltf.animations, name) : undefined;
    if (!clip) return;
    const next = mixer.clipAction(clip);
    if (next === current) return;
    next.reset().play();
    if (current) next.crossFadeFrom(current, CROSSFADE_SECONDS, false);
    setCurrent(next);
  }, [animation, gltf, mixer, current]);

  useEffect(() => () => void mixer.stopAllAction(), [mixer]);
  useFrame((_, delta) => mixer.update(reducedMotion ? 0 : delta));
  return <primitive object={root} />;
};

const Ready = ({ onReady }: { onReady: () => void }) => {
  useEffect(onReady, [onReady]);
  return null;
};

export const SceneView = ({ manifest, animation }: SceneViewProps) => {
  const reducedMotion = useReducedMotion();
  // Keyed by manifest so a new scene shows the note again (child effects run before ours).
  const [readyId, setReadyId] = useState<string>();
  const ready = readyId === manifest.id;
  const { model } = manifest.character;
  const markReady = useMemo(() => () => setReadyId(manifest.id), [manifest.id]);

  return (
    <View style={styles.scene} accessible accessibilityRole="image" accessibilityLabel={manifest.description}>
      <Canvas camera={{ fov: 40, near: 0.1, far: 50 }} onCreated={({ gl }) => paceRenderer(gl)}>
        <color attach="background" args={[color.stage]} />
        <hemisphereLight args={[0xffffff, 0x8a7a66, 2]} />
        <directionalLight position={[3, 5, 4]} intensity={2} />
        <CameraView manifest={manifest} />
        <Room manifest={manifest} />
        <Suspense fallback={null}>
          <Props props={manifest.props} />
          {model && hasAsset(model.url) ? (
            <ModelCharacter model={model} manifest={manifest} animation={animation} reducedMotion={reducedMotion} />
          ) : (
            <Chibi manifest={manifest} animation={animation} reducedMotion={reducedMotion} />
          )}
          <Ready onReady={markReady} />
        </Suspense>
      </Canvas>
      {!ready && (
        <Text style={styles.note} accessibilityLiveRegion="polite" accessibilityRole="text">
          Setting the stage…
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scene: { flex: 1, backgroundColor: color.stage, overflow: "hidden" },
  note: { position: "absolute", alignSelf: "center", top: "45%", color: color.ink, fontSize: 16, fontWeight: "700" },
});
