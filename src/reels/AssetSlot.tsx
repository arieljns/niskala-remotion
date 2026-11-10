import { getStaticFiles, Img, staticFile } from "remotion";
import { FONTS } from "../theme/fonts";
import { withAlpha } from "../theme/motion";
import { COLORS } from "./tokens";

const EXTENSIONS = ["svg", "png", "webp", "jpg"] as const;

/** Where a delivered asset goes: public/reels/assets/<id>.<svg|png|webp|jpg>. */
export function findAsset(id: string): string | undefined {
  const names = getStaticFiles().map((file) => file.name);
  return EXTENSIONS.map((extension) => `reels/assets/${id}.${extension}`).find((path) => names.indexOf(path) !== -1);
}

/**
 * Renders the asset once it exists. Until then: `fallback` if the scene has an
 * agreed stand-in, otherwise a neutral box naming the TODO. Never a fake drawing.
 */
export const AssetSlot: React.FC<{
  id: string;
  fallback?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ id, fallback, style }) => {
  const asset = findAsset(id);

  if (asset) {
    return <Img src={staticFile(asset)} style={{ width: "100%", height: "100%", objectFit: "contain", ...style }} />;
  }
  if (fallback) {
    return <>{fallback}</>;
  }
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
        textAlign: "center",
        fontFamily: FONTS.body,
        fontWeight: 400,
        fontSize: 18,
        color: withAlpha(COLORS.ink, 0.6),
        background: withAlpha(COLORS.ink, 0.06),
        border: `2px solid ${withAlpha(COLORS.ink, 0.15)}`,
        wordBreak: "break-all",
        ...style,
      }}
    >
      {id}
    </div>
  );
};
