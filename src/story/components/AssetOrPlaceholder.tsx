import { getStaticFiles, Img, staticFile } from "remotion";
import { CLIENT, CLIENT_FONTS } from "../../theme/client";
import { withAlpha } from "../../theme/motion";

/**
 * Renders a public/ image if it has been delivered, otherwise a clearly
 * marked placeholder naming the missing file. Used for the pain screenshots
 * that haven't landed yet, so they swap in by just adding the file.
 */
export const AssetOrPlaceholder: React.FC<{ path: string; style?: React.CSSProperties }> = ({ path, style }) => {
  const exists = getStaticFiles().some((f) => f.name === path);

  if (exists) {
    return <Img src={staticFile(path)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", ...style }} />;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 24,
        textAlign: "center",
        fontFamily: CLIENT_FONTS.ui,
        color: CLIENT.ink,
        border: `3px dashed ${CLIENT.accent}`,
        background: `repeating-linear-gradient(45deg, ${withAlpha(CLIENT.ink, 0.06)} 0 12px, ${withAlpha(CLIENT.ink, 0.02)} 12px 24px)`,
        ...style,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: CLIENT.accent }}>
        Placeholder
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, wordBreak: "break-all" }}>{path.split("/").pop()}</div>
      <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.6 }}>belum ada di public/</div>
    </div>
  );
};
