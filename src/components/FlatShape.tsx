import type { CSSProperties } from "react";
import { COLORS } from "../tokens";

/**
 * A generic geometric stand-in — "a channel", "a product", "a container" —
 * never a literal brand logo or recognizable app icon. Every fill is a
 * single flat color, no gradients. `kind="ring"` is a circle forced to
 * `fill="none"` (stroke only) for the Pantau pulse; everything else defaults
 * to a solid fill unless `fill="none"` is passed explicitly.
 */
export type ShapeKind =
  | "circle"
  | "ring"
  | "square"
  | "roundedRect"
  | "triangle"
  | "hexagon"
  | "diamond";

export function FlatShape({
  kind,
  width,
  height,
  size = 64,
  fill,
  stroke,
  strokeWidth = 3,
  cornerRadius = 12,
  style,
}: {
  kind: ShapeKind;
  /** Square bounding box side, used when `width`/`height` aren't given. */
  size?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  /** `roundedRect` only. */
  cornerRadius?: number;
  style?: CSSProperties;
}) {
  const w = width ?? size;
  const h = height ?? size;
  const isRing = kind === "ring";
  const resolvedFill = fill ?? (isRing ? "none" : COLORS.ink);
  const resolvedStroke = stroke ?? (isRing ? COLORS.accent : undefined);

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={style}
      // Decorative shape inside a muted video — never meaningful content.
      aria-hidden="true"
    >
      {renderShape(kind, w, h, cornerRadius)}
    </svg>
  );

  function renderShape(k: ShapeKind, ww: number, hh: number, r: number) {
    const commonProps = {
      fill: resolvedFill,
      stroke: resolvedStroke,
      strokeWidth: resolvedStroke ? strokeWidth : undefined,
    };

    switch (k) {
      case "circle":
      case "ring":
        return (
          <circle
            cx={ww / 2}
            cy={hh / 2}
            r={Math.min(ww, hh) / 2 - (resolvedStroke ? strokeWidth / 2 : 0)}
            {...commonProps}
          />
        );
      case "square":
        return (
          <rect
            x={resolvedStroke ? strokeWidth / 2 : 0}
            y={resolvedStroke ? strokeWidth / 2 : 0}
            width={ww - (resolvedStroke ? strokeWidth : 0)}
            height={hh - (resolvedStroke ? strokeWidth : 0)}
            {...commonProps}
          />
        );
      case "roundedRect":
        return (
          <rect
            x={resolvedStroke ? strokeWidth / 2 : 0}
            y={resolvedStroke ? strokeWidth / 2 : 0}
            width={ww - (resolvedStroke ? strokeWidth : 0)}
            height={hh - (resolvedStroke ? strokeWidth : 0)}
            rx={r}
            ry={r}
            {...commonProps}
          />
        );
      case "triangle":
        return <polygon points={trianglePoints(ww, hh)} {...commonProps} />;
      case "diamond":
        return <polygon points={diamondPoints(ww, hh)} {...commonProps} />;
      case "hexagon":
        return <polygon points={hexagonPoints(ww, hh)} {...commonProps} />;
    }
  }
}

function trianglePoints(w: number, h: number): string {
  const inset = 3;
  return [
    [w / 2, inset],
    [w - inset, h - inset],
    [inset, h - inset],
  ]
    .map((p) => p.join(","))
    .join(" ");
}

function diamondPoints(w: number, h: number): string {
  const inset = 3;
  return [
    [w / 2, inset],
    [w - inset, h / 2],
    [w / 2, h - inset],
    [inset, h / 2],
  ]
    .map((p) => p.join(","))
    .join(" ");
}

function hexagonPoints(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - 3;
  const points: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    // Flat-top hexagon: first vertex at -90deg (straight up).
    const angle = (Math.PI / 180) * (60 * i - 90);
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return points.map((p) => p.join(",")).join(" ");
}
