import { Img } from "remotion";
import { Avatar } from "./ReelScreen";
import { Bag, ChevronDown, Comment, Grid, Home, Menu, PlayBox, PlayFill, Plus, Search } from "./icons";
import { HeroImage } from "./parts";
import { ASSET, GLASS_LIGHT, IOS, MARGIN, PHONE, STORE_HANDLE, TEXT, TODO_PROFILE_STATS, pressStyle, screenRoot } from "./tokens";

const GRID_TOP = 424;
const TILE_WIDTH = PHONE.width / 3;
const TILE_HEIGHT = 172;
export const PROFILE_FIRST_TILE = { x: 0, y: GRID_TOP, width: TILE_WIDTH, height: TILE_HEIGHT } as const;

const TILES: readonly { kind: "hero" | "photo"; src?: string; background: string; reel?: boolean }[] = [
  { kind: "hero", background: "#F3F4F6", reel: true },
  { kind: "photo", src: ASSET.silver, background: "#2A2A2C" },
  { kind: "photo", src: ASSET.blue, background: "#2A2A2C", reel: true },
  { kind: "photo", src: ASSET.black, background: "#2A2A2C" },
  { kind: "hero", background: "#E9DED3" },
  { kind: "photo", src: ASSET.green, background: "#2A2A2C", reel: true },
  { kind: "photo", src: ASSET.blue, background: "#2A2A2C" },
  { kind: "hero", background: "#EDEDF0", reel: true },
  { kind: "photo", src: ASSET.silver, background: "#2A2A2C" },
];
const HIGHLIGHTS = ["Baru", "Promo", "Ulasan", "Botol", "Info"] as const;

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexGrow: 1 }}>
    <span style={{ ...TEXT.headline, fontWeight: 700 }}>{value}</span>
    <span style={TEXT.footnote}>{label}</span>
  </div>
);

/** A store's social profile, recognisable by its layout alone. */
export const ProfileScreen: React.FC<{ firstTilePress?: number }> = ({ firstTilePress = 0 }) => (
  <div style={{ ...screenRoot, background: IOS.bg }}>
    <div style={{ position: "absolute", left: MARGIN, right: MARGIN, top: 59, height: 40, display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ ...TEXT.title3, fontWeight: 700, flexGrow: 0 }}>{STORE_HANDLE}</span>
      <ChevronDown size={14} />
      <div style={{ flexGrow: 1 }} />
      <Plus size={25} />
      <Menu size={25} style={{ marginLeft: 16 }} />
    </div>
    <div style={{ position: "absolute", left: MARGIN, right: MARGIN, top: 106, display: "flex", alignItems: "center" }}>
      <Avatar size={78} />
      <div style={{ display: "flex", flexGrow: 1, marginLeft: 14 }}>
        <Stat value={TODO_PROFILE_STATS.posts} label="Postingan" />
        <Stat value={TODO_PROFILE_STATS.followers} label="Pengikut" />
        <Stat value={TODO_PROFILE_STATS.following} label="Mengikuti" />
      </div>
    </div>
    <div style={{ position: "absolute", left: MARGIN, right: MARGIN, top: 192 }}>
      <div style={{ ...TEXT.subheadline, fontWeight: 600 }}>Toko Kamu</div>
      <div style={TEXT.subheadline}>Botol &amp; tumbler · Kirim tiap hari</div>
    </div>
    <div style={{ position: "absolute", left: MARGIN, right: MARGIN, top: 240, display: "flex", gap: 7 }}>
      <div style={{ ...TEXT.subheadline, fontWeight: 600, flex: 1, height: 34, borderRadius: 9, background: IOS.blue, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center" }}>Ikuti</div>
      <div style={{ ...TEXT.subheadline, fontWeight: 600, flex: 1, height: 34, borderRadius: 9, background: IOS.bg2, display: "flex", alignItems: "center", justifyContent: "center" }}>Kirim pesan</div>
    </div>
    <div style={{ position: "absolute", left: MARGIN, top: 286, display: "flex", gap: 17 }}>
      {HIGHLIGHTS.map((label, index) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: 58, height: 58, borderRadius: "50%", border: `.5px solid ${IOS.label3}`, padding: 3, boxSizing: "border-box" }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: index % 2 === 0 ? "#F3F4F6" : "#2A2A2C", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <HeroImage height={42} />
            </div>
          </div>
          <span style={TEXT.caption}>{label}</span>
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 380, height: 44, display: "flex", borderBottom: `.5px solid ${IOS.separator}`, boxSizing: "border-box" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1.5px solid #000" }}><Grid size={23} /></div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.45 }}><PlayBox size={24} /></div>
    </div>
    <div style={{ position: "absolute", left: 0, top: GRID_TOP, width: PHONE.width, display: "flex", flexWrap: "wrap" }}>
      {TILES.map((tile, index) => (
        <div
          key={index}
          style={{
            position: "relative",
            width: TILE_WIDTH - 1,
            height: TILE_HEIGHT - 1,
            margin: "0 1px 1px 0",
            background: tile.background,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...(index === 0 ? pressStyle(firstTilePress) : {}),
          }}
        >
          {tile.kind === "hero" ? <HeroImage height={142} /> : <Img src={tile.src ?? ""} style={{ height: "110%" }} />}
          {tile.reel ? <div style={{ position: "absolute", right: 7, top: 7, filter: "drop-shadow(0 0 3px rgba(0,0,0,.65))" }}><PlayFill size={15} color="#FFF" /></div> : null}
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 80, ...GLASS_LIGHT, background: "rgba(255,255,255,.9)", borderTop: `.5px solid ${IOS.separator}`, display: "flex", justifyContent: "space-around", paddingTop: 12, boxSizing: "border-box" }}>
      <Home size={26} />
      <Search size={26} />
      <PlayBox size={26} />
      <Comment size={26} />
      <Bag size={26} />
    </div>
  </div>
);
