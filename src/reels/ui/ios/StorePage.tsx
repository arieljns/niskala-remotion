import { Cart, Menu, Minus, Plus } from "./icons";
import { HeroCard, SWATCHES, Swatch } from "./parts";
import { BROWSER_TOP, IOS, MARGIN, PHONE, STORE_WORDMARK, TEXT, pressStyle } from "./tokens";

const BUY_TOP = 722;
const BUY_HEIGHT = 50;
export const STORE_BUY = { x: MARGIN, y: BUY_TOP, width: PHONE.width - MARGIN * 2, height: BUY_HEIGHT } as const;

const pageY = (screenY: number) => screenY - BROWSER_TOP;

/** The seller's own store, with no marketplace in sight. Sits under the browser bar. */
export const StorePage: React.FC<{ buyPress?: number }> = ({ buyPress = 0 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: BROWSER_TOP, bottom: 0, background: IOS.bg, overflow: "hidden" }}>
    <div
      style={{
        ...TEXT.caption,
        fontWeight: 600,
        letterSpacing: ".06em",
        height: 26,
        background: IOS.store,
        color: "#FFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      GRATIS ONGKIR SE-INDONESIA
    </div>
    <div style={{ height: 46, padding: `0 ${MARGIN}px`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Menu size={24} />
      <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: ".01em", color: IOS.store }}>{STORE_WORDMARK}</span>
      <Cart size={24} />
    </div>
    <div style={{ padding: `2px ${MARGIN}px 0` }}>
      <HeroCard width="100%" height={306} imageHeight={272} />
      <div style={{ ...TEXT.headline, fontWeight: 700, marginTop: 11, color: IOS.store, letterSpacing: "0em" }}>TERMOS LED - 500 ML</div>
      <div style={{ ...TEXT.title3, fontWeight: 700, marginTop: 1, color: IOS.store }}>Rp450.000</div>
      <div style={{ ...TEXT.footnote, marginTop: 5, whiteSpace: "normal", color: "#3C3C43" }}>
        Termos stainless dengan layar suhu LED, tahan panas &amp; dingin 24 jam.
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 9 }}>
        <div style={{ display: "flex", gap: 7 }}>
          {SWATCHES.slice(0, 3).map((color, index) => (
            <Swatch key={color} color={color} size={30} selected={index === 0} ringColor={IOS.store} />
          ))}
        </div>
        <div style={{ height: 34, width: 112, borderRadius: 10, border: "1px solid rgba(60,60,67,.24)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 9px", boxSizing: "border-box" }}>
          <Minus size={16} color={IOS.label2} />
          <span style={{ ...TEXT.subheadline, fontWeight: 500 }}>1</span>
          <Plus size={16} />
        </div>
      </div>
    </div>
    <div
      style={{
        ...TEXT.subheadline,
        fontWeight: 600,
        position: "absolute",
        left: MARGIN,
        right: MARGIN,
        top: pageY(BUY_TOP - 54),
        height: 46,
        borderRadius: 12,
        border: `1.5px solid ${IOS.store}`,
        color: IOS.store,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      Tambah ke keranjang
    </div>
    <div
      style={{
        ...TEXT.headline,
        position: "absolute",
        left: MARGIN,
        right: MARGIN,
        top: pageY(BUY_TOP),
        height: BUY_HEIGHT,
        borderRadius: 12,
        background: IOS.store,
        color: "#FFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...pressStyle(buyPress),
      }}
    >
      Beli sekarang
    </div>
  </div>
);
