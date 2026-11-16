import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { FONTS } from "../../theme/fonts";
import { SENJA } from "../../theme/senja";
import { faceGeometry, slabGeometry } from "./geo";
import {
  B,
  CAROUSEL,
  CARDS,
  K,
  SCREEN,
  SCREENS,
  SLIDE_FRAMES,
  TAPS,
  sceneAt,
  sceneRange,
  type FloatCard,
  type SceneId,
} from "./timeline";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1); // expo-out, for every entrance
const inOut = Easing.inOut(Easing.cubic);
const DEG = Math.PI / 180;

/** Stage constants (px, 1080 x 1920). One world unit = one stage px at z = 0, y up. */
const BEZEL = 24;
const OUTER_W = SCREEN.width + BEZEL * 2;
const OUTER_H = SCREEN.height + BEZEL * 2;
const PH_CY = 880;
const FOV = 30;
const CAM_Z = 960 / Math.tan((FOV / 2) * DEG);
const PHONE_DEPTH = 40;
const PHONE_BEVEL = 7;
const FRONT_Z = PHONE_DEPTH / 2 + PHONE_BEVEL;

const CREAM = SENJA.cream100;
const INK = SENJA.plum900;
const ACCENT = SENJA.red500;

export type Images = { screens: Record<string, HTMLImageElement>; logo: HTMLImageElement };

/** Stage point -> world point (y flips). */
const world = (x: number, y: number, z = 0): [number, number, number] => [x - 540, 960 - y, z];

/* ------------------------------------------------------------------ phone poses */

type Pose = { x: number; y: number; s: number; rx: number; ry: number; rz: number };
const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  s: a.s + (b.s - a.s) * t,
  rx: a.rx + (b.rx - a.rx) * t,
  ry: a.ry + (b.ry - a.ry) * t,
  rz: a.rz + (b.rz - a.rz) * t,
});

type Move = { end: Pose; arc?: Partial<Pose>; fn: (t: number) => number };
const lin = (t: number) => t;
const ENTER_START: Pose = { x: 300, y: 200, s: 1.3, rx: 0, ry: -25, rz: 8 };

/**
 * Where the phone ends each scene, plus an "arc" that bows the path in the middle (sin(pi t) * arc) and the
 * easing it travels with. A scene always starts from the previous scene's end pose, so a cut on the beat never
 * teleports the phone, and every scene moves differently: glide, straighten, sweep, lean, swing, drop, push.
 */
const MOVES: Partial<Record<SceneId, Move>> = {
  enter: { end: { x: 0, y: 40, s: 0.8, rx: 8, ry: -16, rz: 4 }, fn: inOut },
  home: { end: { x: 0, y: 40, s: 0.86, rx: 6, ry: -8, rz: 0 }, fn: inOut },
  pdp: { end: { x: 0, y: 60, s: 0.9, rx: 0, ry: 0, rz: 0 }, arc: { s: 0.03 }, fn: ease },
  carousel: { end: { x: 0, y: 40, s: 0.84, rx: -4, ry: 16, rz: 0 }, arc: { ry: 14 }, fn: inOut },
  cart: { end: { x: 0, y: 70, s: 0.8, rx: 10, ry: -6, rz: 0 }, arc: { rx: 10, y: -20 }, fn: ease },
  orders: { end: { x: 20, y: 40, s: 0.82, rx: -4, ry: 10, rz: -3 }, arc: { rz: -5, x: -40 }, fn: inOut },
  inbox: { end: { x: 0, y: 40, s: 0.8, rx: -8, ry: -12, rz: 2 }, arc: { y: -30 }, fn: ease },
  status: { end: { x: 0, y: 50, s: 0.84, rx: 6, ry: 8, rz: 0 }, arc: { rx: -8, ry: 12 }, fn: inOut },
  done: { end: { x: 0, y: 40, s: 0.8, rx: 0, ry: 0, rz: 0 }, arc: { s: 0.04 }, fn: ease },
  crm: { end: { x: -20, y: 40, s: 0.82, rx: 4, ry: -14, rz: 0 }, arc: { x: 50, ry: -10 }, fn: inOut },
  promo: { end: { x: 10, y: 40, s: 0.84, rx: -6, ry: 12, rz: 0 }, arc: { ry: 18 }, fn: lin },
  report: { end: { x: 0, y: 40, s: 0.86, rx: 6, ry: -6, rz: 0 }, arc: { rx: 10 }, fn: ease },
};
const MOVE_ORDER: SceneId[] = ["enter", "home", "pdp", "carousel", "cart", "orders", "inbox", "status", "done", "crm", "promo", "report"];

function phonePose(frame: number): Pose | null {
  const scene = sceneAt(frame);
  const i = MOVE_ORDER.indexOf(scene.id);
  if (i < 0) return null;
  const move = MOVES[scene.id]!;
  const from = i === 0 ? ENTER_START : MOVES[MOVE_ORDER[i - 1]]!.end;
  let pose = lerpPose(from, move.end, move.fn(scene.t));
  const bow = Math.sin(Math.PI * scene.t);
  const arc = move.arc ?? {};
  pose = {
    x: pose.x + (arc.x ?? 0) * bow,
    y: pose.y + (arc.y ?? 0) * bow,
    s: pose.s + (arc.s ?? 0) * bow,
    rx: pose.rx + (arc.rx ?? 0) * bow,
    ry: pose.ry + (arc.ry ?? 0) * bow,
    rz: pose.rz + (arc.rz ?? 0) * bow,
  };
  if (scene.id === "enter") {
    // The phone sweeps in from the right edge, cropped by the frame.
    const slide = 1 - ease(interpolate(frame, [scene.from, scene.from + 14], [0, 1], CLAMP));
    pose = { ...pose, x: pose.x + 760 * slide, rz: pose.rz + 10 * slide };
  }
  return pose;
}

/* ------------------------------------------------------------------ textures */

function canvasTexture(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return { canvas, ctx, texture };
}

const SCREEN_TEX = { w: 936, h: 2026 };

function drawScreen(ctx: CanvasRenderingContext2D, frame: number, images: Images, dim: number) {
  const { w, h } = SCREEN_TEX;
  const px = w / SCREEN.width;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  SCREENS.forEach((screen, index) => {
    const next = SCREENS[index + 1];
    if (frame < screen.from) return;
    const enter = index === 0 ? 1 : ease(interpolate(frame, [screen.from, screen.from + SLIDE_FRAMES], [0, 1], CLAMP));
    const leave = next ? ease(interpolate(frame, [next.from, next.from + SLIDE_FRAMES], [0, 1], CLAMP)) : 0;
    if (leave >= 1) return;
    // 02 -> 03 is one page scrolled down, so it moves vertically; every other change slides sideways.
    const scroll = screen.id === CAROUSEL.screen || next?.id === CAROUSEL.screen;
    const x = scroll ? 0 : ((1 - enter) * SCREEN.width - leave * SCREEN.width * 0.35) * px;
    const y = scroll ? (screen.id === CAROUSEL.screen ? (1 - enter) * h * 0.5 : -leave * h * 0.5) : 0;
    const img = images.screens[screen.id];
    ctx.drawImage(img, x, y, w, h);
    if (screen.id === CAROUSEL.screen && enter >= 1) {
      // "Sering dibeli bersama" scrolls sideways: only that band moves, the rest of the page stays.
      const p = ease(interpolate(frame, [CAROUSEL.from, CAROUSEL.to], [0, 1], CLAMP));
      const y0 = (CAROUSEL.y0 / 2532) * h;
      const y1 = (CAROUSEL.y1 / 2532) * h;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y0, w, y1 - y0);
      ctx.clip();
      ctx.fillStyle = "#fff";
      ctx.fillRect(x, y0, w, y1 - y0);
      ctx.drawImage(img, x - ((CAROUSEL.shift * p) / 1170) * w, 0, w, h);
      ctx.restore();
    }
    if (leave > 0) {
      ctx.fillStyle = `rgba(0,0,0,${0.35 * leave})`;
      ctx.fillRect(x, 0, w, h);
    }
  });
  for (const tap of TAPS) {
    const t = frame - tap.frame;
    if (t < 0 || t > 28) continue;
    const cx = (tap.x / 1170) * w;
    const cy = (tap.y / 2532) * h;
    ctx.fillStyle = `rgba(21,12,17,${interpolate(t, [0, 4, 14, 24], [0, 0.28, 0.28, 0], CLAMP)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 20 * px * (0.6 + 0.4 * Math.min(1, t / 8)), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(21,12,17,${interpolate(t, [4, 10, 28], [0, 0.55, 0], CLAMP)})`;
    ctx.lineWidth = 2 * px;
    ctx.beginPath();
    ctx.arc(cx, cy, 48 * px * (0.4 + 0.6 * ease(interpolate(t, [4, 26], [0, 1], CLAMP))), 0, Math.PI * 2);
    ctx.stroke();
  }
  if (dim > 0) {
    ctx.fillStyle = `rgba(21,12,17,${0.62 * dim})`;
    ctx.fillRect(0, 0, w, h);
  }
}

/* ------------------------------------------------------------------ pieces */

function useSoftShadow(): THREE.CanvasTexture {
  return useMemo(() => {
    const { ctx, texture } = canvasTexture(256, 256);
    ctx.filter = "blur(18px)";
    ctx.fillStyle = "rgba(10,4,8,1)";
    ctx.beginPath();
    ctx.roundRect(48, 48, 160, 160, 44);
    ctx.fill();
    texture.needsUpdate = true;
    return texture;
  }, []);
}

const SoftShadow: React.FC<{ w: number; h: number; opacity: number; position: [number, number, number] }> = ({ w, h, opacity, position }) => {
  const map = useSoftShadow();
  if (opacity <= 0.002) return null;
  return (
    <mesh position={position} renderOrder={-1}>
      <planeGeometry args={[w * 1.6, h * 1.6]} />
      <meshBasicMaterial map={map} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

const cardProgress = (card: FloatCard, frame: number) =>
  ease(interpolate(frame, [card.from, card.from + 10], [0, 1], CLAMP)) * (1 - ease(interpolate(frame, [card.to - 8, card.to], [0, 1], CLAMP)));

/** The phone: a metal slab with a lit screen, a dynamic island and a moving glass sheen. */
const Phone: React.FC<{ images: Images; pose: Pose }> = ({ images, pose }) => {
  const frame = useCurrentFrame();
  const adminSide = ["inbox", "status", "done", "crm", "promo", "report"].includes(sceneAt(frame).id);
  const rig = useMemo(() => {
    const screen = canvasTexture(SCREEN_TEX.w, SCREEN_TEX.h);
    const sheen = canvasTexture(256, 512);
    // Additive blending adds the texture's RGB, so the band is white on opaque black (alpha would be ignored).
    const g = sheen.ctx.createLinearGradient(0, 0, 256, 512);
    g.addColorStop(0, "#000");
    g.addColorStop(0.42, "#000");
    g.addColorStop(0.5, "#fff");
    g.addColorStop(0.58, "#000");
    g.addColorStop(1, "#000");
    sheen.ctx.fillStyle = g;
    sheen.ctx.fillRect(0, 0, 256, 512);
    sheen.texture.wrapS = THREE.RepeatWrapping;
    sheen.texture.repeat.set(2, 1);
    sheen.texture.needsUpdate = true;
    return { screen, sheen };
  }, []);
  const body = useMemo(() => slabGeometry(OUTER_W, OUTER_H, 84, PHONE_DEPTH, PHONE_BEVEL), []);
  const screenFace = useMemo(() => faceGeometry(SCREEN.width, SCREEN.height, 60), []);
  const island = useMemo(() => faceGeometry(210, 60, 30), []);

  const cardDim = CARDS.reduce((acc, card) => Math.max(acc, cardProgress(card, frame) * (card.dim ? 1 : 0.5)), 0);
  drawScreen(rig.screen.ctx, frame, images, cardDim);
  rig.screen.texture.needsUpdate = true;
  // The glare sweeps diagonally across the glass in the "cart" scene, a slow idle shimmer elsewhere.
  const scene = sceneAt(frame);
  rig.sheen.texture.offset.x = scene.id === "cart" ? 1 - 1.6 * scene.t : 0.5 + Math.sin((2 * Math.PI * frame) / B(16)) * 0.5;

  const bob = Math.sin((2 * Math.PI * frame) / B(8)) * 8;
  return (
    <group position={world(540 + pose.x, PH_CY + pose.y + bob * 0)} scale={pose.s} rotation={[-pose.rx * DEG, pose.ry * DEG, -pose.rz * DEG]}>
      <group position={[0, -bob, 0]}>
        <SoftShadow w={OUTER_W} h={OUTER_H} opacity={0.5} position={[30, -70, -140]} />
        <mesh geometry={body}>
          <meshBasicMaterial attach="material-0" color={adminSide ? "#34191b" : "#2b2328"} toneMapped={false} />
          <meshBasicMaterial attach="material-1" color={adminSide ? ACCENT : "#463b42"} toneMapped={false} />
        </mesh>
        <group position={[0, 0, FRONT_Z + 0.6]}>
          <mesh geometry={screenFace}>
            <meshBasicMaterial map={rig.screen.texture} toneMapped={false} />
          </mesh>
          <mesh geometry={island} position={[0, SCREEN.height / 2 - 52, 1]}>
            <meshBasicMaterial color="#050305" toneMapped={false} />
          </mesh>
        </group>
        {CARDS.map((card) => (
          <FloatingCard key={`${card.screen}-${card.from}`} card={card} images={images} />
        ))}
        {scene.id === "orders" ? <OrderPing /> : null}
      </group>
    </group>
  );
};

/** A real piece of the screen, lifted off the glass: thick edge, textured face, soft shadow underneath. */
const FloatingCard: React.FC<{ card: FloatCard; images: Images }> = ({ card, images }) => {
  const frame = useCurrentFrame();
  const w = card.w * K;
  const h = card.h * K;
  const texture = useMemo(() => {
    const t = new THREE.Texture(images.screens[card.screen]);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  }, [images, card.screen]);
  const slab = useMemo(() => slabGeometry(w, h, card.r * K, 9, 3), [w, h, card.r]);
  const face = useMemo(() => faceCrop(w, h, card), [w, h, card]);
  if (frame < card.from || frame > card.to) return null;
  const p = cardProgress(card, frame);
  const bob = Math.sin(((frame - card.from) / B(4)) * 2 * Math.PI) * 5 * p;
  const cx = card.x * K + w / 2 - SCREEN.width / 2 + card.ox * 0.3 * p;
  const cy = SCREEN.height / 2 - (card.y * K + h / 2) - card.oy * 0.3 * p + bob;
  const z = FRONT_Z + 4 + card.z * p;
  return (
    <>
      <SoftShadow w={w} h={h} opacity={0.55 * p} position={[cx + 10, cy - 40 * p, FRONT_Z + 2]} />
      <group position={[cx, cy, z]} rotation={[0, 0, -card.rot * p * DEG]}>
        <mesh geometry={slab}>
          <meshBasicMaterial color="#f4efe9"  toneMapped={false} />
        </mesh>
        <mesh geometry={face} position={[0, 0, 9 / 2 + 3 + 0.4]}>
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      </group>
    </>
  );
};

const faceCrop = (w: number, h: number, c: { x: number; y: number; w: number; h: number; r: number }) =>
  faceGeometry(w - 4, h - 4, c.r * K - 2, [(c.x + 2 / K) / 1170, 1 - (c.y + c.h - 2 / K) / 2532, (c.x + c.w - 2 / K) / 1170, 1 - (c.y + 2 / K) / 2532]);

/** "Pesanan baru": a Niskala motion element detached from the glass; the app has no pop-up of its own. */
const OrderPing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tex = useMemo(() => canvasTexture(1640, 300), []);
  const slab = useMemo(() => slabGeometry(820, 150, 40, 14, 4), []);
  const face = useMemo(() => faceGeometry(812, 142, 36), []);
  const t = frame - sceneAt(frame).from;
  if (t < 0 || t > B(2.2)) return null;
  const out = interpolate(t, [B(1.8), B(2.2)], [1, 0], CLAMP);
  const { ctx, texture } = tex;
  ctx.fillStyle = SENJA.paper50;
  ctx.fillRect(0, 0, 1640, 300);
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.roundRect(72, 66, 168, 168, 48);
  ctx.fill();
  ctx.textBaseline = "middle";
  ctx.fillStyle = CREAM;
  ctx.font = `700 88px "${FONTS.display}"`;
  ctx.fontStretch = "expanded";
  ctx.textAlign = "center";
  ctx.fillText("+1", 156, 154);
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.fillText("Pesanan baru", 288, 118);
  ctx.fillStyle = SENJA.muted;
  ctx.font = `400 60px ${FONTS.body}`;
  ctx.fontStretch = "normal";
  ctx.fillText("MJ-0038 · Mora Jaya", 288, 208);
  texture.needsUpdate = true;
  const lift = spring({ frame: t, fps, config: { damping: 15, stiffness: 120, mass: 0.8 } });
  const bob = Math.sin((t / B(4)) * 2 * Math.PI) * 5;
  const y = SCREEN.height / 2 - 520 + lift * 60 + bob;
  return (
    <group position={[-20 * (1 - lift), y, FRONT_Z + 4 + 300 * lift]} rotation={[8 * DEG * lift, -6 * DEG * lift, 0]} scale={out}>
      <SoftShadow w={820} h={150} opacity={0.5 * lift} position={[16, -50, -30]} />
      <mesh geometry={slab}>
        <meshBasicMaterial color="#f7f1ea"  toneMapped={false} />
      </mesh>
      <mesh geometry={face} position={[0, 0, 7 + 4 + 0.4]}>
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
};

const World: React.FC<{ images: Images }> = ({ images }) => {
  const frame = useCurrentFrame();
  const scene = sceneAt(frame);
  const pose = phonePose(frame);
  
  const [from, to] = sceneRange(scene.id);
  void from;
  void to;
  return (
    <>
      <group>
        {pose ? <Phone images={images} pose={pose} /> : null}
      </group>
    </>
  );
};

export const Scene3D: React.FC<{ images: Images }> = ({ images }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      flat
      camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 200, far: 12000 }}
      gl={{ alpha: true, antialias: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <World images={images} />
    </ThreeCanvas>
  );
};
