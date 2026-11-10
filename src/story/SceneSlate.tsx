import { AbsoluteFill } from "remotion";
import { displayFont, FONTS } from "../theme/fonts";
import { withAlpha } from "../theme/motion";
import { SENJA } from "../theme/senja";
import { getCaptionArea, useLayout } from "../useLayout";
import type { ActSpec, SceneSpec } from "./timeline";

/**
 * Temporary stand-in for a scene that hasn't been built yet: names the act
 * and scene and shows its caption in the caption safe area, so the full
 * timeline can be scrubbed in Studio from Stage 1. Each stage replaces slates
 * with the real scene in `scenes/index.ts`.
 */
export const SceneSlate: React.FC<{ act: ActSpec; scene: SceneSpec }> = ({ act, scene }) => {
  const layout = useLayout();
  const caption = getCaptionArea(layout);

  return (
    <AbsoluteFill style={{ backgroundColor: SENJA.paper50, fontFamily: FONTS.body, color: SENJA.plum900 }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: layout.spacing.sm }}>
        <div style={{ fontSize: layout.font.sm, fontWeight: 600, color: withAlpha(SENJA.plum900, 0.55) }}>
          {act.title} · placeholder
        </div>
        <div style={{ ...displayFont(layout.font.xxl, 500), maxWidth: layout.maxContentWidth, textAlign: "center" }}>
          {scene.id} · {scene.name}
        </div>
        <div style={{ fontSize: layout.font.sm, fontWeight: 400, color: withAlpha(SENJA.plum900, 0.55) }}>
          {scene.durationInFrames} frame{scene.contohData ? " · Contoh data" : ""}
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: (layout.width - caption.maxWidth) / 2,
          width: caption.maxWidth,
          bottom: caption.bottom,
          textAlign: "center",
          ...displayFont(caption.fontSize, 500),
          lineHeight: 1.25,
        }}
      >
        {scene.caption}
      </div>
    </AbsoluteFill>
  );
};
