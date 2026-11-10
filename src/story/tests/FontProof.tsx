import { loadFont as loadGoogleArchivo } from "@remotion/google-fonts/Archivo";
import { AbsoluteFill } from "remotion";
import { displayFont, eyebrowFont, FONTS } from "../../theme/fonts";
import { withAlpha } from "../../theme/motion";
import { SENJA, SENJA_GRADIENTS } from "../../theme/senja";

/**
 * Step 3 proof: the same caption in self-hosted Archivo at width 125, at
 * width 100, and in @remotion/google-fonts/Archivo asked for 125% (which has
 * no wdth axis, so it stays normal width). If row 1 isn't visibly wider than
 * row 2, the expanded face isn't loading.
 */
const googleArchivo = loadGoogleArchivo("normal", { weights: ["500"], subsets: ["latin"] });

const TEXT = "Pesanan berikutnya, langsung ke toko Anda.";

const Row: React.FC<{ label: string; style: React.CSSProperties }> = ({ label, style }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ ...eyebrowFont(15, 600), color: SENJA.muted }}>{label}</div>
    <div style={{ fontSize: 64, lineHeight: 1.05, color: SENJA.plum900, whiteSpace: "nowrap", ...style }}>
      <span style={{ background: withAlpha(SENJA.orange400, 0.14) }}>{TEXT}</span>
    </div>
  </div>
);

export const FontProof: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: SENJA.paper50, padding: 80, gap: 56, justifyContent: "center" }}>
    <Row label="1 · Archivo self-hosted · font-stretch 125% (what the video uses)" style={displayFont(64, 500)} />
    <Row label="2 · Same file · font-stretch 100%" style={{ ...displayFont(64, 500), fontStretch: "100%" }} />
    <Row
      label="3 · @remotion/google-fonts/Archivo · asked for 125% (no wdth axis)"
      style={{ fontFamily: googleArchivo.fontFamily, fontWeight: 500, fontStretch: "125%", letterSpacing: "-0.045em" }}
    />
    <div style={{ display: "flex", gap: 48, alignItems: "baseline" }}>
      <span style={{ ...displayFont(64, 500), color: SENJA.plum900 }}>
        Satu frasa{" "}
        <span style={{ backgroundImage: SENJA_GRADIENTS.textLight, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          bergradien
        </span>
      </span>
      <span style={{ ...displayFont(120, 300), color: SENJA.plum900 }}>6,6x</span>
      <span style={{ fontFamily: FONTS.body, fontWeight: 300, fontSize: 26, color: SENJA.muted }}>Lexend 300 sub-line, 26px</span>
    </div>
  </AbsoluteFill>
);
