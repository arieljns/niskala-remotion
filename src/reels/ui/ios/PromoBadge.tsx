import { useCurrentFrame } from "remotion";
import { Lightning, Ticket, Truck } from "./icons";
import { INTER } from "./tokens";

const ORANGE = "#FF7A1A";
const INK = "#2A2A2C";

export type PromoKind = "flash" | "kembar" | "ongkir";

/** Fills its box, so S3's flight and sink stay in charge of position. World pixels, not phone points. */
const FLASH_START_SECONDS = 2 * 3600 + 14 * 60 + 9;

const clock = (frame: number) => {
  const left = Math.max(0, FLASH_START_SECONDS - Math.floor(frame / 30));
  const part = (value: number) => String(value).padStart(2, "0");
  return `${part(Math.floor(left / 3600))}:${part(Math.floor(left / 60) % 60)}:${part(left % 60)}`;
};

const base: React.CSSProperties = {
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
  fontFamily: INTER,
  fontWeight: 700,
  fontSize: 38,
  letterSpacing: "-0.02em",
  whiteSpace: "nowrap",
  boxShadow: "0 30px 60px -20px rgba(42,20,32,.28)",
};

export const PromoBadge: React.FC<{ kind: PromoKind }> = ({ kind }) => {
  const frame = useCurrentFrame();
  if (kind === "flash") {
    return (
      <div style={{ ...base, borderRadius: 26, background: INK, color: "#FFF" }}>
        <Lightning size={44} color={ORANGE} fill={ORANGE} />
        Flash sale
        <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: 32, padding: "8px 14px", borderRadius: 12, background: "rgba(255,255,255,.14)" }}>{clock(frame)}</span>
      </div>
    );
  }
  if (kind === "kembar") {
    // Round bites out of the long edges, plus a dashed tear line: a ticket.
    const bite = "radial-gradient(circle 20px at 0 50%,transparent 19.5px,#000 20px) left, radial-gradient(circle 20px at 100% 50%,transparent 19.5px,#000 20px) right";
    return (
      <div
        style={{
          ...base,
          boxShadow: undefined,
          filter: "drop-shadow(0 22px 22px rgba(42,20,32,.2))",
        }}
      >
        <div
          style={{
            ...base,
            boxShadow: undefined,
            borderRadius: 20,
            background: ORANGE,
            color: "#FFF",
            WebkitMask: bite,
            WebkitMaskSize: "51% 100%",
            WebkitMaskRepeat: "no-repeat",
            mask: bite,
            maskSize: "51% 100%",
            maskRepeat: "no-repeat",
            position: "relative",
          }}
        >
          <Ticket size={42} color="#FFF" />
          Diskon tanggal kembar
          <div style={{ position: "absolute", left: 50, top: 12, bottom: 12, borderLeft: "3px dashed rgba(255,255,255,.55)" }} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ ...base, borderRadius: 60, background: "#FFF", color: INK }}>
      <Truck size={46} color={ORANGE} />
      Gratis ongkir
    </div>
  );
};
