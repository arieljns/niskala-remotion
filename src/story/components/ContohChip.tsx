import { eyebrowFont } from "../../theme/fonts";
import { SENJA, SENJA_SHADOWS } from "../../theme/senja";

/**
 * "Contoh data" label for every device showing admin numbers or growth:
 * cream-100 pill, plum-900 Lexend 600 15px uppercase, +0.14em. Pinned to the
 * device it labels (PhoneFrame/LaptopFrame `contoh` prop), straddling its top
 * edge, and visible from the device's first frame.
 */
export const ContohChip: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      ...eyebrowFont(15, 600),
      lineHeight: 1,
      whiteSpace: "nowrap",
      color: SENJA.plum900,
      backgroundColor: SENJA.cream100,
      borderRadius: 999,
      padding: "9px 14px",
      boxShadow: SENJA_SHADOWS.tag,
      zIndex: 20,
      ...style,
    }}
  >
    Contoh data
  </div>
);

/** The pinned placement used by the device frames (canvas px, outside the screen). */
export const ContohPin: React.FC = () => <ContohChip style={{ position: "absolute", top: -16, right: "9%" }} />;
