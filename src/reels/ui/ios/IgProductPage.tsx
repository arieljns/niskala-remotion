import { Bag, ChevronLeft, Heart, Share, Star } from "./icons";
import { HeroCard, SWATCHES, Swatch } from "./parts";
import { BROWSER_TOP, HERO, IOS, MARGIN, PHONE, STORE_HANDLE, TEXT, pressStyle, screenRoot } from "./tokens";

const IMAGE_HEIGHT = 384;
const CTA_TOP = 752;
const CTA_HEIGHT = 50;
const HEART_WIDTH = 50;
export const IG_CTA = {
  x: MARGIN,
  y: CTA_TOP,
  width: PHONE.width - MARGIN * 2 - HEART_WIDTH - 10,
  height: CTA_HEIGHT,
} as const;

export const IgProductPage: React.FC<{ ctaPress?: number }> = ({ ctaPress = 0 }) => (
  <div style={{ ...screenRoot, background: IOS.bg }}>
    <div style={{ position: "absolute", left: MARGIN - 4, right: MARGIN, top: 59, height: 44, display: "flex", alignItems: "center", gap: 16 }}>
      <ChevronLeft size={26} />
      <span style={{ ...TEXT.headline, flexGrow: 1, textAlign: "center", marginLeft: 34 }}>{STORE_HANDLE}</span>
      <Bag size={24} />
      <Share size={24} />
    </div>
    <div style={{ position: "absolute", left: MARGIN, right: MARGIN, top: BROWSER_TOP + 2 }}>
      <HeroCard width="100%" height={IMAGE_HEIGHT} imageHeight={336}>
        <div style={{ position: "absolute", bottom: 11, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
          {[0, 1, 2, 3].map((dot) => (
            <div key={dot} style={{ width: 6, height: 6, borderRadius: 3, background: dot === 0 ? "#000" : "rgba(0,0,0,.2)" }} />
          ))}
        </div>
      </HeroCard>
      <div style={{ ...TEXT.title2, marginTop: 11 }}>{HERO.name}</div>
      <div style={{ ...TEXT.title3, marginTop: 1, color: "#3A3A3C", fontWeight: 700 }}>{HERO.price}</div>
      <div style={{ ...TEXT.footnote, display: "flex", alignItems: "center", gap: 4, marginTop: 3, color: IOS.label2 }}>
        <Star size={13} />
        4,8 · 128 ulasan
      </div>
      <div style={{ ...TEXT.footnote, fontWeight: 600, marginTop: 10 }}>Warna</div>
      <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
        {SWATCHES.map((color, index) => (
          <Swatch key={color} color={color} size={32} selected={index === 0} />
        ))}
      </div>
      <div style={{ ...TEXT.footnote, fontWeight: 600, marginTop: 9 }}>Ukuran</div>
      <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
        {["500 ml", "750 ml"].map((size, index) => (
          <div
            key={size}
            style={{
              ...TEXT.footnote,
              fontWeight: index === 0 ? 600 : 400,
              height: 31,
              padding: "0 15px",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              background: index === 0 ? IOS.bg2 : "transparent",
              border: `1px solid ${index === 0 ? "#000" : "rgba(60,60,67,.24)"}`,
              color: index === 0 ? "#000" : IOS.label2,
            }}
          >
            {size}
          </div>
        ))}
      </div>
    </div>
    <div
      style={{
        ...TEXT.headline,
        position: "absolute",
        left: IG_CTA.x,
        top: IG_CTA.y,
        width: IG_CTA.width,
        height: IG_CTA.height,
        borderRadius: 12,
        background: IOS.blue,
        color: "#FFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...pressStyle(ctaPress),
      }}
    >
      Lihat di website
    </div>
    <div
      style={{
        position: "absolute",
        right: MARGIN,
        top: CTA_TOP,
        width: HEART_WIDTH,
        height: CTA_HEIGHT,
        borderRadius: 12,
        background: IOS.bg2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Heart size={24} />
    </div>
  </div>
);
