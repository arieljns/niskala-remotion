import { SquaresFour } from "@phosphor-icons/react";
import { COLORS } from "../tokens";

/**
 * Generic dashboard glyph — Phosphor `SquaresFour`, regular weight only (the
 * site's locked icon style). Reused in Fondasi beat 3 (the storefront gains
 * a dashboard) and Kendali (the unified dashboard concept), so it only gets
 * built once.
 */
export function DashboardIcon({
  size = 48,
  color = COLORS.ink,
}: {
  size?: number;
  color?: string;
}) {
  return <SquaresFour size={size} weight="regular" color={color} aria-hidden="true" />;
}
