import { Img } from "remotion";
import { COLORS, withAlpha } from "../../tokens";
import { fontFamily } from "../../fonts";
import { useLayout } from "../../useLayout";
import { ICONS, PRODUCT_PHOTOS } from "../../assets";

const PRODUCTS = [
  { name: "Tote Anyaman Kulit", price: "Rp 899.000", photo: PRODUCT_PHOTOS.bagWoven },
  { name: "Tas Satchel Mini", price: "Rp 449.000", photo: PRODUCT_PHOTOS.bagSatchel },
  { name: "Sling Bag Kulit", price: "Rp 649.000", photo: PRODUCT_PHOTOS.bagSling },
];

/**
 * Coded storefront — a representative customer-facing commerce site: a nav
 * with wordmark + search + cart, a promo hero, and a priced product grid
 * with buy buttons. Built from theme tokens and Manrope (`fontFamily`)
 * only, no gray-box placeholders. Shared by Beat1ChaosOpen / Beat3StoreReveal
 * (full size) and Beat4CapabilityFanout (shrunk) — the brief describes the
 * same frame shrinking and moving, not a new mockup appearing.
 */
export function StorefrontMock() {
  const layout = useLayout();
  const pad = layout.spacing.md;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: COLORS.cream }}>
      {/* nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: layout.spacing.sm,
          padding: `${layout.spacing.sm}px ${pad}px`,
          borderBottom: `1px solid ${withAlpha(COLORS.ink, 0.1)}`,
        }}
      >
        {/* the "Niskala" wordmark — the one place the design system keeps 800 outside proof stats */}
        <span style={{ fontFamily, fontSize: layout.font.sm, fontWeight: 800, color: COLORS.ink }}>
          Niskala
        </span>
        <div
          style={{
            flex: 1,
            maxWidth: "46%",
            height: layout.spacing.md,
            borderRadius: 999,
            background: withAlpha(COLORS.ink, 0.06),
            display: "flex",
            alignItems: "center",
            padding: `0 ${layout.spacing.sm}px`,
            fontFamily,
            fontSize: layout.font.xs,
            color: withAlpha(COLORS.ink, 0.45),
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          Cari produk…
        </div>
        <div
          style={{
            position: "relative",
            width: layout.icon.md,
            height: layout.icon.md,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Img src={ICONS.cart} style={{ width: "100%", height: "100%" }} />
          <span
            style={{
              position: "absolute",
              top: -layout.spacing.xs * 0.5,
              right: -layout.spacing.xs * 0.5,
              minWidth: layout.font.sm,
              height: layout.font.sm,
              padding: `0 ${layout.spacing.xs * 0.3}px`,
              borderRadius: 999,
              background: COLORS.accent,
              color: COLORS.cream,
              fontFamily,
              fontSize: layout.font.xs * 0.72,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            3
          </span>
        </div>
      </div>

      {/* promo hero */}
      <div
        style={{
          margin: `${pad}px ${pad}px ${layout.spacing.sm}px`,
          padding: `${layout.spacing.sm}px ${pad}px`,
          borderRadius: layout.radius.md,
          background: withAlpha(COLORS.accent, 0.14),
          display: "flex",
          flexDirection: "column",
          gap: layout.spacing.xs,
        }}
      >
        <span style={{ fontFamily, fontSize: layout.font.md, fontWeight: 600, color: COLORS.ink }}>Koleksi Terbaru</span>
        <span style={{ fontFamily, fontSize: layout.font.xs, color: withAlpha(COLORS.ink, 0.7) }}>
          Gratis ongkir untuk pembelian pertama
        </span>
        <span
          style={{
            marginTop: layout.spacing.xs,
            alignSelf: "flex-start",
            padding: `${layout.spacing.xs * 0.6}px ${layout.spacing.sm}px`,
            borderRadius: 999,
            background: COLORS.accent,
            color: COLORS.cream,
            fontFamily,
            fontSize: layout.font.xs,
            fontWeight: 700,
          }}
        >
          Belanja Sekarang
        </span>
      </div>

      {/* product grid — the bag image flexes to fill whatever height the
          frame leaves, so nav + name + price stay visible whether the
          storefront is full size (Beat 3) or shrunk (Beat 4) */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: layout.spacing.sm,
          padding: `0 ${pad}px ${pad}px`,
        }}
      >
        {PRODUCTS.map((p) => (
          <div key={p.name} style={{ display: "flex", flexDirection: "column", minHeight: 0, gap: layout.spacing.xs * 0.6 }}>
            <div
              style={{
                flex: 1,
                minHeight: 0,
                width: "100%",
                borderRadius: layout.radius.sm,
                background: withAlpha(COLORS.ink, 0.06),
                overflow: "hidden",
              }}
            >
              <Img src={p.photo} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <span
              style={{
                fontFamily,
                fontSize: layout.font.xs,
                fontWeight: 600,
                color: COLORS.ink,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {p.name}
            </span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: layout.spacing.sm }}>
              <span style={{ fontFamily, fontSize: layout.font.xs, fontWeight: 700, color: COLORS.accent, whiteSpace: "nowrap" }}>
                {p.price}
              </span>
              <span
                style={{
                  padding: `${layout.spacing.xs * 0.4}px ${layout.spacing.xs}px`,
                  borderRadius: layout.radius.sm,
                  border: `1px solid ${withAlpha(COLORS.ink, 0.2)}`,
                  fontFamily,
                  fontSize: layout.font.xs * 0.9,
                  fontWeight: 700,
                  color: COLORS.ink,
                }}
              >
                Beli
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
