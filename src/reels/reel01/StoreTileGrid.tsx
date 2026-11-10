import { memo, useMemo } from "react";
import { Img, interpolate, useCurrentFrame } from "remotion";
import { cameraAt, type CameraKeyframe } from "../camera";
import { FOCAL, REEL } from "../tokens";
import { Star } from "../ui/ios/icons";
import { HeroImage } from "../ui/ios/parts";
import { ASSET, INTER, STORE_HANDLE } from "../ui/ios/tokens";

/** In world pixels. The hero tile is centred on the focal point, so every zoom shrinks it in place. */
export const TILE = { width: 220, height: 300, gap: 24, radius: 16 } as const;
const COLS = 24;
const ROWS = 40;
const HERO_COL = 11;
const HERO_ROW = 16;
const PITCH_X = TILE.width + TILE.gap;
const PITCH_Y = TILE.height + TILE.gap;
const IMAGE = TILE.width - 24;
/**
 * Tiles this close to the hero are seen large, so each is real, with a photo.
 * The rest are only ever seen tiny and are one pre-drawn pattern: hundreds of
 * separately faded tiles, five times over for motion blur, crash the render.
 */
const NEAR_RADIUS = 3;
const FADE_FRAMES = 10;
const TILE_OPACITY = 0.4;
const OUTLINE_PX = 2;
const GLOW_PX = 26;
const CREAM = "255,233,190";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const tileX = (col: number) => FOCAL.x - TILE.width / 2 + (col - HERO_COL) * PITCH_X;
const tileY = (row: number) => FOCAL.y - TILE.height / 2 + (row - HERO_ROW) * PITCH_Y;

export const HERO_TILE = { x: tileX(HERO_COL), y: tileY(HERO_ROW), width: TILE.width, height: TILE.height } as const;

const OTHER_PHOTOS = [ASSET.silver, ASSET.black, ASSET.blue, ASSET.green] as const;

type TileData = { key: string; col: number; row: number; x: number; y: number; photo: string };

const isNear = (col: number, row: number) => Math.abs(col - HERO_COL) <= NEAR_RADIUS && Math.abs(row - HERO_ROW) <= NEAR_RADIUS;

const NEAR_TILES: readonly TileData[] = Array.from({ length: COLS * ROWS }, (_, index) => {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return { key: `${col}-${row}`, col, row, x: tileX(col), y: tileY(row), photo: OTHER_PHOTOS[(col + row * 3) % OTHER_PHOTOS.length] };
}).filter((tile) => isNear(tile.col, tile.row) && !(tile.col === HERO_COL && tile.row === HERO_ROW));

const GRID_LEFT = tileX(0);
const GRID_TOP = tileY(0);
const NEAR_BLOCK = {
  x: (HERO_COL - NEAR_RADIUS) * PITCH_X,
  y: (HERO_ROW - NEAR_RADIUS) * PITCH_Y,
  width: (NEAR_RADIUS * 2 + 1) * PITCH_X,
  height: (NEAR_RADIUS * 2 + 1) * PITCH_Y,
} as const;
/** The grid around the near block, cut on tile edges so the pattern lines up with the real tiles. */
const FAR_REGIONS = [
  { x: 0, y: 0, width: COLS * PITCH_X, height: NEAR_BLOCK.y },
  { x: 0, y: NEAR_BLOCK.y + NEAR_BLOCK.height, width: COLS * PITCH_X, height: (ROWS * PITCH_Y) - NEAR_BLOCK.y - NEAR_BLOCK.height },
  { x: 0, y: NEAR_BLOCK.y, width: NEAR_BLOCK.x, height: NEAR_BLOCK.height },
  { x: NEAR_BLOCK.x + NEAR_BLOCK.width, y: NEAR_BLOCK.y, width: (COLS * PITCH_X) - NEAR_BLOCK.x - NEAR_BLOCK.width, height: NEAR_BLOCK.height },
] as const;

const FarTiles = memo(() => (
  <svg width={COLS * PITCH_X} height={ROWS * PITCH_Y} style={{ display: "block" }}>
    <defs>
      <pattern id="far-store-tile" width={PITCH_X} height={PITCH_Y} patternUnits="userSpaceOnUse">
        <rect x={0.5} y={0.5} width={TILE.width - 1} height={TILE.height - 1} rx={TILE.radius} fill="#1E1A1D" stroke={`rgba(${CREAM},.08)`} />
        <rect x={12} y={12} width={IMAGE} height={IMAGE} rx={10} fill="#2A2528" />
        <rect x={88} y={48} width={44} height={124} rx={14} fill="rgba(255,255,255,.14)" />
        <rect x={12} y={219} width={110} height={12} rx={6} fill="rgba(255,255,255,.3)" />
        <rect x={12} y={240} width={160} height={9} rx={4.5} fill="rgba(255,255,255,.2)" />
        <rect x={12} y={258} width={120} height={9} rx={4.5} fill="rgba(255,255,255,.2)" />
      </pattern>
    </defs>
    {FAR_REGIONS.map((region) => (
      <rect key={`${region.x}-${region.y}`} {...region} fill="url(#far-store-tile)" />
    ))}
  </svg>
));
FarTiles.displayName = "FarTiles";

const Stars: React.FC<{ color: string }> = ({ color }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {[0, 1, 2, 3, 4].map((star) => (
      <Star key={star} size={13} color={color} />
    ))}
  </div>
);

const cardStyle: React.CSSProperties = {
  width: TILE.width,
  height: TILE.height,
  boxSizing: "border-box",
  padding: 12,
  borderRadius: TILE.radius,
  background: "#1E1A1D",
  border: `1px solid rgba(${CREAM},.08)`,
  display: "flex",
  flexDirection: "column",
  gap: 9,
  overflow: "hidden",
};

const Bar: React.FC<{ width: number; height?: number; color?: string }> = ({ width, height = 9, color = "rgba(255,255,255,.2)" }) => (
  <div style={{ width, height, borderRadius: height / 2, background: color, flexShrink: 0 }} />
);

/** Only ever re-rendered if its data changes, so hundreds of them cost nothing per frame. */
const StoreTile = memo<{ photo: string }>(({ photo }) => (
  <div style={cardStyle}>
    <div style={{ width: IMAGE, height: IMAGE, flexShrink: 0, borderRadius: 10, background: "#2A2528", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Img src={photo} style={{ height: "100%", filter: "grayscale(1) brightness(.72)" }} />
    </div>
    <Bar width={110} height={12} color="rgba(255,255,255,.3)" />
    <Bar width={160} />
    <Bar width={120} />
    <Stars color="rgba(255,255,255,.22)" />
  </div>
));
StoreTile.displayName = "StoreTile";

const HeroTile: React.FC<{ scale: number; imageScale: number }> = ({ scale, imageScale }) => (
  <div
    style={{
      ...cardStyle,
      background: "#2B2629",
      // Set in screen pixels, so the outline survives the pull-back and the eye can follow it.
      border: `${OUTLINE_PX / scale}px solid rgb(${CREAM})`,
      boxShadow: `0 0 ${GLOW_PX / scale}px ${4 / scale}px rgba(${CREAM},.5)`,
    }}
  >
    <div style={{ width: IMAGE - 2, height: IMAGE, flexShrink: 0, borderRadius: 10, background: "#3A3437", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${imageScale})` }}>
        <HeroImage height={IMAGE - 14} />
      </div>
    </div>
    <div style={{ fontFamily: INTER, fontSize: 19, lineHeight: "20px", fontWeight: 700, color: "#FFF", letterSpacing: "-0.01em" }}>{STORE_HANDLE}</div>
    <Bar width={150} color="rgba(255,255,255,.34)" />
    <Bar width={110} color="rgba(255,255,255,.34)" />
    <Stars color="#FF9F0A" />
  </div>
);

/**
 * Generated from data, and only the near tiles inside the frame are mounted.
 * Each fades in from the moment the pull-back brings it into the frame; the far
 * pattern fades in as one, as the frame first reaches it.
 */
export const StoreTileGrid: React.FC<{ keyframes: readonly CameraKeyframe[]; pullStart: number; pullEnd: number }> = ({
  keyframes,
  pullStart,
  pullEnd,
}) => {
  const frame = useCurrentFrame();
  const camera = cameraAt(keyframes, frame);
  const inView = (tile: TileData, state: { x: number; y: number; s: number }) => {
    const left = state.x - FOCAL.x / state.s;
    const top = state.y - FOCAL.y / state.s;
    return (
      tile.x + TILE.width >= left &&
      tile.x <= left + REEL.width / state.s &&
      tile.y + TILE.height >= top &&
      tile.y <= top + REEL.height / state.s
    );
  };
  const { entered, farFrom } = useMemo(() => {
    const frames = new Map<string, number>();
    let far = pullEnd;
    for (let at = pullEnd; at >= pullStart; at--) {
      const state = cameraAt(keyframes, at);
      NEAR_TILES.forEach((tile) => {
        if (inView(tile, state)) {
          frames.set(tile.key, at);
        }
      });
      // The frame still fits inside the near block until the far tiles are about to show.
      const left = state.x - FOCAL.x / state.s;
      const top = state.y - FOCAL.y / state.s;
      const outside =
        left < GRID_LEFT + NEAR_BLOCK.x ||
        top < GRID_TOP + NEAR_BLOCK.y ||
        left + REEL.width / state.s > GRID_LEFT + NEAR_BLOCK.x + NEAR_BLOCK.width ||
        top + REEL.height / state.s > GRID_TOP + NEAR_BLOCK.y + NEAR_BLOCK.height;
      if (outside) {
        far = at;
      }
    }
    return { entered: frames, farFrom: far };
  }, [keyframes, pullEnd, pullStart]);

  const imageScale = interpolate(frame, [0, pullStart], [1, 1.08], clamp);

  return (
    <>
      {frame >= farFrom ? (
        <div
          style={{
            position: "absolute",
            left: GRID_LEFT,
            top: GRID_TOP,
            opacity: interpolate(frame, [farFrom, farFrom + FADE_FRAMES], [0, TILE_OPACITY], clamp),
          }}
        >
          <FarTiles />
        </div>
      ) : null}
      {frame >= pullStart
        ? NEAR_TILES.map((tile) => {
            const from = entered.get(tile.key);
            if (from === undefined || frame < from || !inView(tile, camera)) {
              return null;
            }
            return (
              <div
                key={tile.key}
                style={{
                  position: "absolute",
                  left: tile.x,
                  top: tile.y,
                  opacity: interpolate(frame, [from, from + FADE_FRAMES], [0, TILE_OPACITY], clamp),
                }}
              >
                <StoreTile photo={tile.photo} />
              </div>
            );
          })
        : null}
      <div style={{ position: "absolute", left: HERO_TILE.x, top: HERO_TILE.y }}>
        <HeroTile scale={camera.s} imageScale={imageScale} />
      </div>
    </>
  );
};
