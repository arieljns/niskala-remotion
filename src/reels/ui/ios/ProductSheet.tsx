import { DarkProductImage, HeroCard } from "./parts";
import { GLASS_DARK, HERO, IOS, MARGIN, PHONE, STORE_HANDLE, TEXT, TODO_PRODUCT_NAMES, pressStyle, screenRoot } from "./tokens";

export const SHEET_TOP = 272;
const GRID_TOP = 62;
const GAP = 10;
const CARD_WIDTH = (PHONE.width - MARGIN * 2 - GAP) / 2;
const CARD_HEIGHT = 234;
const IMAGE_HEIGHT = 136;

/** In phone points, with the sheet fully up. */
export const SHEET_HERO_CARD = {
  x: MARGIN,
  y: SHEET_TOP + GRID_TOP,
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
} as const;

const Card: React.FC<{
  image: React.ReactNode;
  name: string;
  seller?: string;
  price: string;
  press?: number;
}> = ({ image, name, seller, price, press = 0 }) => (
  <div
    style={{
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      boxSizing: "border-box",
      borderRadius: 12,
      border: `.5px solid ${IOS.darkSeparator}`,
      background: "#161618",
      padding: 8,
      display: "flex",
      flexDirection: "column",
      ...pressStyle(press),
    }}
  >
    {image}
    <div style={{ ...TEXT.subheadline, marginTop: 9, color: "#FFF", overflow: "hidden" }}>{name}</div>
    {seller ? <div style={{ ...TEXT.footnote, color: IOS.darkLabel2, marginTop: 1 }}>{seller}</div> : null}
    <div style={{ ...TEXT.subheadline, fontWeight: 600, color: "#FFF", marginTop: "auto" }}>{price}</div>
  </div>
);

/** Dark sheet from the reel. `slide` is 0 down, 1 fully up; the caller dims what's behind. */
export const ProductSheet: React.FC<{ slide?: number; heroPress?: number }> = ({ slide = 1, heroPress = 0 }) => (
  <div
    style={{
      ...screenRoot,
      top: SHEET_TOP,
      borderRadius: "38px 38px 0 0",
      color: "#FFF",
      ...GLASS_DARK,
      background: "rgba(28,28,30,.92)",
      transform: `translateY(${(1 - slide) * (PHONE.height - SHEET_TOP)}px)`,
    }}
  >
    <div style={{ position: "absolute", left: (PHONE.width - 36) / 2, top: 8, width: 36, height: 5, borderRadius: 3, background: "rgba(235,235,245,.34)" }} />
    <div style={{ ...TEXT.headline, position: "absolute", left: 0, right: 0, top: 22, textAlign: "center" }}>Di reels ini</div>
    <div
      style={{
        position: "absolute",
        left: MARGIN,
        right: MARGIN,
        top: GRID_TOP,
        display: "grid",
        gridTemplateColumns: `${CARD_WIDTH}px ${CARD_WIDTH}px`,
        gap: GAP,
      }}
    >
      <Card
        press={heroPress}
        image={<HeroCard width="100%" height={IMAGE_HEIGHT} imageHeight={120} dark radius={10} />}
        name={HERO.name}
        seller={STORE_HANDLE}
        price={HERO.price}
      />
      {TODO_PRODUCT_NAMES.map((product) => (
        <Card
          key={product.name}
          image={<DarkProductImage src={product.image} height={IMAGE_HEIGHT} />}
          name={product.name}
          price={product.price}
        />
      ))}
    </div>
  </div>
);
