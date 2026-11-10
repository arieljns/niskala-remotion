import { AbsoluteFill, Sequence } from "remotion";
import { COLORS } from "./tokens";
import { BackgroundAmbient } from "./components/BackgroundAmbient";
import { Beat1ChaosOpen } from "./scenes/Beat1ChaosOpen";
import { Beat2Migration } from "./scenes/Beat2Migration";
import { Beat3StoreReveal } from "./scenes/Beat3StoreReveal";
import { Beat4CapabilityFanout } from "./scenes/Beat4CapabilityFanout";
import { Beat5ProductProof } from "./scenes/Beat5ProductProof";
import { Beat6Outcome } from "./scenes/Beat6Outcome";

/**
 * The single source of truth for chunk-one's timing. Both ChunkOneDesktop
 * and ChunkOneMobile (registered in Root.tsx) render this same <ChunkOne>
 * component at different canvas sizes — every beat reads its frame range
 * from here, and every component under it reads its layout from
 * useLayout.ts, so aspect ratio is the only thing that ever differs between
 * the two compositions.
 */
export const BEATS = [
  { name: "chaos-open", from: 0, to: 90 },
  { name: "migration", from: 90, to: 180 },
  { name: "store-reveal", from: 180, to: 300 },
  { name: "capability-fanout", from: 300, to: 420 },
  { name: "product-proof", from: 420, to: 540 },
  { name: "outcome", from: 540, to: 660 },
] as const;

export const CHUNK_ONE_FPS = 30;
export const CHUNK_ONE_DURATION_FRAMES = BEATS[BEATS.length - 1].to;

export const ChunkOne: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream }}>
      <BackgroundAmbient />
      {BEATS.map((beat) => (
        <Sequence key={beat.name} name={beat.name} from={beat.from} durationInFrames={beat.to - beat.from} layout="none">
          <Beat name={beat.name} durationInFrames={beat.to - beat.from} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

function Beat({ name, durationInFrames }: { name: (typeof BEATS)[number]["name"]; durationInFrames: number }) {
  switch (name) {
    case "chaos-open":
      return <Beat1ChaosOpen />;
    case "migration":
      return <Beat2Migration durationInFrames={durationInFrames} />;
    case "store-reveal":
      return <Beat3StoreReveal />;
    case "capability-fanout":
      return <Beat4CapabilityFanout />;
    case "product-proof":
      return <Beat5ProductProof />;
    case "outcome":
      return <Beat6Outcome durationInFrames={durationInFrames} />;
  }
}
