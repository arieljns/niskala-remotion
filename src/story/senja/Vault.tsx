import { SENJA_GRADIENTS } from "../../theme/senja";
import { useLayout } from "../../useLayout";

/**
 * The deck's rounded-top card: the stage behind every device. It bleeds off
 * the bottom of the frame. Radius 64 (40 in 9:16, per DESIGN-SYSTEM.md §4.5).
 */
export const Vault: React.FC<{
  /** Centre x and top y of the card, in canvas px. It runs to the bottom edge and past it. */
  centerX: number;
  top: number;
  width: number;
  fill?: "grad" | "glass";
  style?: React.CSSProperties;
}> = ({ centerX, top, width, fill = "grad", style }) => {
  const layout = useLayout();
  const radius = layout.isPortrait ? 40 : 64;

  return (
    <div
      style={{
        position: "absolute",
        left: centerX - width / 2,
        top,
        width,
        // Bleed: runs 10% past the bottom of the frame.
        height: layout.height - top + layout.height * 0.1,
        borderRadius: `${radius}px ${radius}px 0 0`,
        ...(fill === "grad"
          ? { background: SENJA_GRADIENTS.card, boxShadow: "0 -1px 0 rgba(255,255,255,.3) inset" }
          : {
              background: SENJA_GRADIENTS.vaultGlass,
              border: "1.5px solid rgba(255,233,190,.45)",
              borderBottom: 0,
              backdropFilter: "blur(14px)",
            }),
        ...style,
      }}
    />
  );
};
