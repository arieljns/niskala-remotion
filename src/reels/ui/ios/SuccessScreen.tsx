import { evolvePath } from "@remotion/paths";
import { interpolate, useCurrentFrame } from "remotion";
import { BROWSER_TOP, HERO, IOS, MARGIN, ORDER_NUMBER, PHONE, TEXT, TODO_ORDER_DATE } from "./tokens";

const CHECK_FRAMES = 14;
const RING = "M60 12a48 48 0 1 1 0 96a48 48 0 1 1 0-96";
const TICK = "M38 62 L54 77 L84 44";

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ ...TEXT.subheadline, display: "flex", justifyContent: "space-between", marginTop: 9 }}>
    <span style={{ color: IOS.label2 }}>{label}</span>
    <span>{value}</span>
  </div>
);

/** Under the browser bar. The check draws itself from `drawStart`. */
export const SuccessScreen: React.FC<{ drawStart?: number }> = ({ drawStart = -100 }) => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const ring = interpolate(frame, [drawStart, drawStart + CHECK_FRAMES - 4], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 2) });
  const tick = interpolate(frame, [drawStart + 5, drawStart + CHECK_FRAMES], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 2) });
  const glow = interpolate(frame, [drawStart, drawStart + CHECK_FRAMES], [0, 1], clamp);
  const ringPath = evolvePath(ring, RING);
  const tickPath = evolvePath(tick, TICK);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: BROWSER_TOP, bottom: 0, background: IOS.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: (PHONE.width - 150) / 2, top: 54, width: 150, height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(52,199,89,.13)", boxShadow: "0 0 40px 8px rgba(52,199,89,.2)", opacity: glow }} />
        <svg viewBox="0 0 120 120" width={118} height={118} style={{ position: "relative" }} fill="none" stroke={IOS.green} strokeLinecap="round" strokeLinejoin="round">
          <path d={RING} strokeWidth={8} strokeDasharray={ringPath.strokeDasharray} strokeDashoffset={ringPath.strokeDashoffset} />
          <path d={TICK} strokeWidth={9} strokeDasharray={tickPath.strokeDasharray} strokeDashoffset={tickPath.strokeDashoffset} />
        </svg>
      </div>
      <div style={{ ...TEXT.title2, fontSize: 26, lineHeight: "32px", position: "absolute", left: 0, right: 0, top: 218, textAlign: "center" }}>Pembayaran berhasil</div>
      <div style={{ position: "absolute", left: MARGIN + 8, right: MARGIN + 8, top: 278 }}>
        <div style={{ ...TEXT.headline }}>Detail transaksi</div>
        <Row label="No. pesanan" value={ORDER_NUMBER} />
        <Row label="Tanggal" value={TODO_ORDER_DATE} />
        <Row label="Metode" value="QRIS" />
        <div style={{ ...TEXT.subheadline, color: IOS.label2, marginTop: 24 }}>Total dibayar</div>
        <div style={{ ...TEXT.largeTitle, marginTop: 1 }}>{HERO.price}</div>
      </div>
      <div
        style={{
          ...TEXT.headline,
          position: "absolute",
          left: MARGIN + 8,
          right: MARGIN + 8,
          bottom: 40,
          height: 50,
          borderRadius: 12,
          background: "#111114",
          color: "#FFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Kembali ke toko
      </div>
    </div>
  );
};
