import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING_CONFIG } from "../tokens";
import { useLayout } from "../useLayout";
import { BrowserFrame } from "../components/BrowserFrame";
import { HighlightText } from "../components/HighlightText";
import { StorefrontMock } from "../components/mocks/StorefrontMock";

/**
 * Beat 3 (180-300) — the storefront BrowserFrame scales up from center,
 * then the headline lands with "Sendiri" in the accent highlight box.
 * `widthPct` is a fraction of canvas width so the frame reads as roughly
 * the same proportion of the screen in both orientations.
 */
export function Beat3StoreReveal() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();

  const frameEntrance = spring({ frame, fps, config: SPRING_CONFIG });
  const widthPct = layout.isPortrait ? 0.86 : 0.5;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: layout.spacing.lg }}>
      <div style={{ transform: `scale(${0.4 + frameEntrance * 0.6})`, opacity: frameEntrance }}>
        <BrowserFrame widthPct={widthPct} showBrowserIcon>
          <StorefrontMock />
        </BrowserFrame>
      </div>

      <div style={{ maxWidth: layout.isPortrait ? layout.width * 0.86 : layout.width * 0.5 }}>
        <HighlightText
          text="Pengalaman Belanja Milik Sendiri"
          highlight="Sendiri"
          startFrame={24}
          fontSize={layout.isPortrait ? layout.font.lg : layout.font.xl}
        />
      </div>
    </AbsoluteFill>
  );
}
