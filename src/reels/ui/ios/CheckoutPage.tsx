import { Bag, Check, ChevronDown } from "./icons";
import { HeroImage, RollingPrice } from "./parts";
import { BROWSER_TOP, HERO, IOS, MARGIN, PHONE, STORE_WORDMARK, TEXT, pressStyle } from "./tokens";

const FIELD_HEIGHT = 48;
const FIELD_GAP = 9;
const SECTION_GAP = 18;
const TITLE_HEIGHT = 30;

/**
 * Page coordinates, top to bottom. The rows above the fold are a fixed stack, so
 * the end of the page and the auto-scroll distance can be known exactly.
 */
const HEADER = 46;
const SUMMARY = 56;
const CONTACT_TOP = HEADER + SUMMARY + SECTION_GAP;
const CHECKBOX_TOP = CONTACT_TOP + TITLE_HEIGHT + FIELD_HEIGHT + 10;
const DELIVERY_TOP = CHECKBOX_TOP + 22 + SECTION_GAP;
const FIELDS_TOP = DELIVERY_TOP + TITLE_HEIGHT;
const FIELD_LIST = ["Nama depan", "Nama belakang", "Alamat", "Kota", "Provinsi", "Kode pos"] as const;
const COUNTRY_HEIGHT = 54;
const FIELDS_END = FIELDS_TOP + COUNTRY_HEIGHT + FIELD_GAP + FIELD_LIST.length * (FIELD_HEIGHT + FIELD_GAP);
const TOTAL_TOP = FIELDS_END + 8;
const TOTAL_HEIGHT = 36;
const PAY_TOP = TOTAL_TOP + TOTAL_HEIGHT + 8;
const PAY_HEIGHT = 50;
const CONTENT_HEIGHT = PAY_TOP + PAY_HEIGHT + 46;

export const CHECKOUT_SCROLL = CONTENT_HEIGHT - (PHONE.height - BROWSER_TOP);

/** In phone points, with the page fully scrolled. */
export const CHECKOUT_END = (() => {
  const toScreen = (y: number) => BROWSER_TOP + y - CHECKOUT_SCROLL;
  return {
    total: { x: MARGIN, y: toScreen(TOTAL_TOP), width: PHONE.width - MARGIN * 2, height: TOTAL_HEIGHT },
    pay: { x: MARGIN, y: toScreen(PAY_TOP), width: PHONE.width - MARGIN * 2, height: PAY_HEIGHT },
  };
})();

const fieldStyle: React.CSSProperties = {
  ...TEXT.subheadline,
  height: FIELD_HEIGHT,
  boxSizing: "border-box",
  borderRadius: 10,
  border: "1px solid rgba(60,60,67,.24)",
  padding: "0 13px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  color: "rgba(60,60,67,.56)",
  background: IOS.bg,
};

const SectionTitle: React.FC<{ children: string; top: number }> = ({ children, top }) => (
  <div style={{ ...TEXT.headline, position: "absolute", left: MARGIN, top, height: TITLE_HEIGHT }}>{children}</div>
);

export const CheckoutPage: React.FC<{ scroll?: number; rollStart?: number; payPress?: number }> = ({
  scroll = 0,
  rollStart = -100,
  payPress = 0,
}) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: BROWSER_TOP, bottom: 0, background: IOS.bg, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: CONTENT_HEIGHT, transform: `translateY(${-scroll}px)` }}>
      <div style={{ height: HEADER, padding: `0 ${MARGIN}px`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: ".01em", color: IOS.store }}>{STORE_WORDMARK}</span>
        <Bag size={23} />
      </div>
      <div
        style={{
          height: SUMMARY,
          padding: `0 ${MARGIN}px`,
          background: IOS.bg2,
          borderTop: `.5px solid ${IOS.separator}`,
          borderBottom: `.5px solid ${IOS.separator}`,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ width: 38, height: 42, borderRadius: 8, background: "#FFF", border: `.5px solid ${IOS.separator}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <HeroImage height={36} />
        </div>
        <span style={{ ...TEXT.subheadline, display: "flex", alignItems: "center", gap: 4, flexGrow: 1 }}>
          Ringkasan pesanan <ChevronDown size={13} />
        </span>
        <RollingPrice start={rollStart} style={{ ...TEXT.subheadline, fontWeight: 600, lineHeight: 1.25 }} />
      </div>

      <SectionTitle top={CONTACT_TOP}>Kontak</SectionTitle>
      <div style={{ ...fieldStyle, position: "absolute", left: MARGIN, right: MARGIN, top: CONTACT_TOP + TITLE_HEIGHT }}>Email</div>
      <div style={{ ...TEXT.footnote, position: "absolute", left: MARGIN, top: CHECKBOX_TOP, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 20, height: 20, borderRadius: 5, background: IOS.store, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={13} color="#FFF" stroke={3} />
        </div>
        Kirimi saya info promo
      </div>

      <SectionTitle top={DELIVERY_TOP}>Pengiriman</SectionTitle>
      <div style={{ position: "absolute", left: MARGIN, right: MARGIN, top: FIELDS_TOP, display: "flex", flexDirection: "column", gap: FIELD_GAP }}>
        <div style={{ ...fieldStyle, height: COUNTRY_HEIGHT }}>
          <div>
            <div style={{ ...TEXT.caption, color: "rgba(60,60,67,.56)" }}>Negara/Wilayah</div>
            <div style={{ ...TEXT.subheadline, color: "#000" }}>Indonesia</div>
          </div>
          <ChevronDown size={15} color="#3C3C43" />
        </div>
        {FIELD_LIST.map((field) => (
          <div key={field} style={fieldStyle}>
            {field}
            {field === "Provinsi" ? <ChevronDown size={15} color="#3C3C43" /> : null}
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", left: MARGIN, right: MARGIN, top: TOTAL_TOP, height: TOTAL_HEIGHT, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={TEXT.headline}>Total</span>
        <RollingPrice start={rollStart} value={HERO.price} style={{ ...TEXT.title3, fontWeight: 700, lineHeight: 1.25 }} />
      </div>
      <div
        style={{
          ...TEXT.headline,
          position: "absolute",
          left: MARGIN,
          right: MARGIN,
          top: PAY_TOP,
          height: PAY_HEIGHT,
          borderRadius: 12,
          background: IOS.store,
          color: "#FFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...pressStyle(payPress),
        }}
      >
        Bayar sekarang
      </div>
    </div>
  </div>
);
