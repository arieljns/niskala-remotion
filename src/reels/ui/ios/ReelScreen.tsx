import { Img, interpolate, useCurrentFrame } from "remotion";
import { Bag, Bookmark, Camera, Comment, Ellipsis, Heart, Music, Plane } from "./icons";
import { HeroImage } from "./parts";
import { ASSET, GLASS_DARK, HERO, INTER, PHONE, STORE_HANDLE, TEXT, kenBurns, pressStyle, screenRoot } from "./tokens";

export const PILL_BOX = { x: 14, y: 654, width: 252, height: 42 } as const;

/** TODO_REEL_FOOTAGE: until real b-roll exists, the hero product in a warm dark set. */
const ReelFootage: React.FC = () => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame % 180, [0, 180], [-60, 140]);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "linear-gradient(172deg,#17130F 0%,#2B211A 44%,#5A402C 78%,#7A5A40 100%)" }}>
      <div style={{ position: "absolute", left: -80, top: 80, width: 340, height: 340, borderRadius: "50%", background: "rgba(255,190,130,.16)", filter: "blur(60px)" }} />
      <div style={{ position: "absolute", right: -100, top: 300, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,150,90,.14)", filter: "blur(70px)" }} />
      {/* A tabletop the product stands on. */}
      <div style={{ position: "absolute", left: -20, right: -20, top: 590, bottom: -20, background: "linear-gradient(180deg,#6E4F38 0%,#3A2A1F 100%)", filter: "blur(2px)" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          scale: String(kenBurns(frame, 300)),
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "absolute", top: 606, left: "50%", width: 200, height: 26, translate: "-50% 0", borderRadius: "50%", background: "rgba(0,0,0,.55)", filter: "blur(12px)" }} />
        <HeroImage height={470} style={{ position: "absolute", top: 148 }} />
      </div>
      <div
        style={{
          position: "absolute",
          top: -100,
          bottom: -100,
          left: `${sweep}%`,
          width: 150,
          rotate: "14deg",
          background: "linear-gradient(90deg,transparent,rgba(255,240,220,.12),transparent)",
        }}
      />
    </div>
  );
};

const RailItem: React.FC<{ children: React.ReactNode; count?: string }> = ({ children, count }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
    {children}
    {count ? <span style={{ ...TEXT.caption, fontWeight: 600 }}>{count}</span> : null}
  </div>
);

export const Avatar: React.FC<{ size: number; letter?: string; ring?: string; background?: string }> = ({
  size,
  letter = "T",
  ring,
  background = "#3A1424",
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background,
      color: "#FFF",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.44,
      fontWeight: 600,
      flexShrink: 0,
      boxShadow: ring ? `0 0 0 1.5px ${ring}` : undefined,
    }}
  >
    {letter}
  </div>
);

export type TagPillProps = {
  /** 0 hidden, 1 settled, may overshoot while popping. */
  pop?: number;
  press?: number;
};

/** The "keranjang putih". Absolute at PILL_BOX inside a reel. */
export const ProductTagPill: React.FC<TagPillProps> = ({ pop = 1, press = 0 }) =>
  pop <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: PILL_BOX.x,
        top: PILL_BOX.y,
        width: PILL_BOX.width,
        height: PILL_BOX.height,
        boxSizing: "border-box",
        borderRadius: 21,
        ...GLASS_DARK,
        border: ".5px solid rgba(255,255,255,.2)",
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "0 12px 0 10px",
        color: "#FFF",
        fontFamily: INTER,
        whiteSpace: "nowrap",
        transformOrigin: "20% 50%",
        scale: String(pop),
        ...pressStyle(press),
      }}
    >
      <Bag size={18} color="#FFF" stroke={1.9} />
      <div style={{ width: 26, height: 30, borderRadius: 6, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <HeroImage height={26} />
      </div>
      <span style={{ ...TEXT.footnote, fontWeight: 600, flexGrow: 1 }}>{HERO.name}</span>
      <span style={{ ...TEXT.footnote, opacity: 0.72 }}>+3</span>
    </div>
  );

const REEL_LOOP_FRAMES = 540;

export const ReelScreen: React.FC<{ pill?: TagPillProps; startProgress?: number }> = ({
  pill = { pop: 0 },
  startProgress = 0.08,
}) => {
  const frame = useCurrentFrame();
  const progress = (startProgress + frame / REEL_LOOP_FRAMES) % 1;
  return (
    <div style={{ ...screenRoot, background: "#111", color: "#FFF" }}>
      <ReelFootage />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 150, background: "linear-gradient(180deg,rgba(0,0,0,.42),transparent)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 330, background: "linear-gradient(0deg,rgba(0,0,0,.72) 0%,rgba(0,0,0,.42) 48%,transparent 100%)" }} />

      <div style={{ position: "absolute", left: 16, right: 16, top: 60, height: 40, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ ...TEXT.title3, fontWeight: 700 }}>Reels</span>
        <Camera size={26} color="#FFF" />
      </div>

      <div
        style={{
          position: "absolute",
          right: 10,
          bottom: 62,
          width: 44,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 17,
        }}
      >
        <RailItem count="12,4 rb"><Heart size={29} color="#FFF" /></RailItem>
        <RailItem count="318"><Comment size={28} color="#FFF" /></RailItem>
        <RailItem count="96"><Plane size={27} color="#FFF" /></RailItem>
        <RailItem><Bookmark size={27} color="#FFF" /></RailItem>
        <RailItem><Ellipsis size={25} color="#FFF" /></RailItem>
        <div style={{ width: 28, height: 28, borderRadius: 7, overflow: "hidden", boxShadow: "0 0 0 1.5px #FFF", background: "#2A2A2C" }}>
          <Img src={ASSET.black} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>

      <ProductTagPill {...pill} />

      <div style={{ position: "absolute", left: 14, top: 706, right: 70 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Avatar size={32} ring="rgba(255,255,255,.9)" />
          <span style={{ ...TEXT.subheadline, fontWeight: 600 }}>{STORE_HANDLE}</span>
          <span style={{ ...TEXT.footnote, fontWeight: 600, padding: "3px 11px", borderRadius: 8, border: "1px solid rgba(255,255,255,.75)" }}>Ikuti</span>
        </div>
        <div style={{ ...TEXT.footnote, marginTop: 9, overflow: "hidden" }}>
          Teman minum harian kamu <span style={{ opacity: 0.68 }}>…selengkapnya</span>
        </div>
        <div style={{ ...TEXT.caption, marginTop: 6, display: "flex", alignItems: "center", gap: 5, opacity: 0.92 }}>
          <Music size={12} color="#FFF" stroke={2.2} />
          {STORE_HANDLE} · Audio asli
        </div>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: PHONE.height - 22, height: 2.5, background: "rgba(255,255,255,.26)" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: "#FFF" }} />
      </div>
    </div>
  );
};
