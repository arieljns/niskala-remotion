import { DarkProductImage, HeroImage } from "./parts";
import { ChevronLeft, Cart, Lightning, Search, Ticket, Truck } from "./icons";
import { HERO, IOS, MARGIN, PHONE, SAFE_TOP, STORE_HANDLE, TEXT, TODO_PRODUCT_NAMES, screenRoot } from "./tokens";
import { COLORS } from "../../tokens";

const PROMO_ORANGE = "#FF7A1A";
const GAP = 10;
const CARD_WIDTH = (PHONE.width - MARGIN * 2 - GAP) / 2;
const CARD_HEIGHT = 300;
const IMAGE_HEIGHT = 188;
const ROW = CARD_HEIGHT + GAP;
const HEADER_TOP = SAFE_TOP + 92;
const SECTION_HEIGHT = 44;

/** How far the list drops: two rows of promoted cards and their section labels, which takes the hero off the screen. */
export const SEARCH_SINK = ROW * 2 + SECTION_HEIGHT * 2;

/** The hero card in phone points, before the list moves. */
export const SEARCH_HERO_CARD = { x: MARGIN, y: HEADER_TOP, width: CARD_WIDTH, height: CARD_HEIGHT } as const;

type PromoLabel = "Flash sale" | "Diskon" | "Gratis ongkir";

const PROMO_STYLE: Record<PromoLabel, { background: string; color: string; icon: React.ReactNode }> = {
  "Flash sale": { background: "#2A2A2C", color: "#FFF", icon: <Lightning size={12} color={PROMO_ORANGE} fill={PROMO_ORANGE} /> },
  Diskon: { background: PROMO_ORANGE, color: "#FFF", icon: <Ticket size={12} color="#FFF" /> },
  "Gratis ongkir": { background: "#FFF", color: "#2A2A2C", icon: <Truck size={12} color={PROMO_ORANGE} /> },
};

/** PromoBadge's three looks at card size, without the running clock. */
const MiniPromo: React.FC<{ label: PromoLabel }> = ({ label }) => {
  const { background, color, icon } = PROMO_STYLE[label];
  return (
    <div
      style={{
        position: "absolute",
        left: 8,
        top: 8,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 8px",
        borderRadius: 8,
        background,
        color,
        fontSize: 12,
        lineHeight: "16px",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        boxShadow: "0 3px 8px rgba(42,20,32,.2)",
      }}
    >
      {icon}
      {label}
    </div>
  );
};

const Card: React.FC<{
  image: React.ReactNode;
  overlay?: React.ReactNode;
  name: string;
  price: string;
  seller: string;
  mine?: boolean;
}> = ({ image, overlay, name, price, seller, mine }) => (
  <div
    style={{
      position: "relative",
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      boxSizing: "border-box",
      borderRadius: 12,
      background: IOS.bg,
      border: mine ? `2px solid ${COLORS.plum}` : `.5px solid ${IOS.separator}`,
      padding: 7,
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div style={{ position: "relative" }}>
      {image}
      {overlay}
    </div>
    <div style={{ ...TEXT.subheadline, marginTop: 9, overflow: "hidden" }}>{name}</div>
    <div style={{ ...TEXT.headline, marginTop: 3 }}>{price}</div>
    <div style={{ ...TEXT.footnote, color: IOS.label2, marginTop: "auto" }}>{seller}</div>
  </div>
);

const HeroResult: React.FC = () => (
  <Card
    mine
    name={HERO.name}
    price={HERO.price}
    seller={STORE_HANDLE}
    image={
      <div
        style={{
          height: IMAGE_HEIGHT,
          borderRadius: 10,
          background: IOS.imageLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <HeroImage height={IMAGE_HEIGHT - 18} shadow />
      </div>
    }
    overlay={
      <div
        style={{
          position: "absolute",
          left: 8,
          top: 8,
          padding: "4px 8px",
          borderRadius: 8,
          background: COLORS.cream,
          color: COLORS.plum,
          fontSize: 12,
          lineHeight: "16px",
          fontWeight: 700,
          letterSpacing: "-0.01em",
        }}
      >
        Toko kamu
      </div>
    }
  />
);

const dark = (src: string) => <DarkProductImage src={src} height={IMAGE_HEIGHT} />;

const OtherResult: React.FC<{ index: number; seller: string; promo?: PromoLabel }> = ({ index, seller, promo }) => {
  const product = TODO_PRODUCT_NAMES[index % TODO_PRODUCT_NAMES.length];
  return (
    <Card
      image={dark(product.image)}
      overlay={promo ? <MiniPromo label={promo} /> : undefined}
      name={product.name}
      price={product.price}
      seller={seller}
    />
  );
};

const SectionLabel: React.FC<{ children: string; y: number }> = ({ children, y }) => (
  <div style={{ ...TEXT.headline, position: "absolute", left: MARGIN, top: y, height: SECTION_HEIGHT, display: "flex", alignItems: "center" }}>
    {children}
  </div>
);

const Chip: React.FC<{ label: string; selected?: boolean }> = ({ label, selected }) => (
  <div
    style={{
      ...TEXT.footnote,
      fontWeight: selected ? 600 : 400,
      padding: "6px 14px",
      borderRadius: 16,
      background: selected ? IOS.label : IOS.bg2,
      color: selected ? "#FFF" : IOS.label,
    }}
  >
    {label}
  </div>
);

const Grid: React.FC<{ y: number; children: React.ReactNode }> = ({ y, children }) => (
  <div
    style={{
      position: "absolute",
      left: MARGIN,
      top: y,
      display: "grid",
      gridTemplateColumns: `${CARD_WIDTH}px ${CARD_WIDTH}px`,
      gap: GAP,
    }}
  >
    {children}
  </div>
);

/** A generic shopping search. `drop` is how far the list has moved, in points. */
export const SearchResults: React.FC<{ drop?: number }> = ({ drop = 0 }) => (
  <div style={screenRoot}>
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${drop}px)` }}>
      {/* Above the list, waiting for it to come down. */}
      <div style={{ position: "absolute", left: 0, right: 0, top: HEADER_TOP - SEARCH_SINK }}>
        <SectionLabel y={0}>Sedang promo</SectionLabel>
        <Grid y={SECTION_HEIGHT}>
          <OtherResult index={0} seller="Toko Botol" promo="Flash sale" />
          <OtherResult index={1} seller="Grosir Tumbler" promo="Diskon" />
          <OtherResult index={2} seller="Serba Botol" promo="Gratis ongkir" />
          <OtherResult index={0} seller="Rumah Termos" promo="Diskon" />
        </Grid>
        <SectionLabel y={SECTION_HEIGHT + ROW * 2}>Lainnya</SectionLabel>
      </div>
      <Grid y={HEADER_TOP}>
        <HeroResult />
        <OtherResult index={1} seller="Toko Dapur" />
        <OtherResult index={2} seller="Pusat Botol" />
        <OtherResult index={0} seller="Toko Rumah" />
        <OtherResult index={1} seller="Toko Termos" />
        <OtherResult index={2} seller="Serba Dapur" />
      </Grid>
    </div>
    {/* The search bar and chips stay put, and the list slides under them. */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: HEADER_TOP - 6, background: IOS.bg, borderBottom: `.5px solid ${IOS.separator}` }}>
      <div style={{ position: "absolute", left: MARGIN - 4, right: MARGIN, top: SAFE_TOP + 2, display: "flex", alignItems: "center", gap: 8 }}>
        <ChevronLeft size={22} color={IOS.label} />
        <div style={{ ...TEXT.subheadline, flex: 1, height: 36, display: "flex", alignItems: "center", gap: 7, padding: "0 12px", borderRadius: 18, background: IOS.bg2 }}>
          <Search size={16} color={IOS.label2} />
          termos
        </div>
        <Cart size={23} color={IOS.label} />
      </div>
      <div style={{ position: "absolute", left: MARGIN, top: SAFE_TOP + 46, display: "flex", gap: 8 }}>
        <Chip selected label="Terkait" />
        <Chip label="Terlaris" />
        <Chip label="Harga" />
      </div>
    </div>
  </div>
);

