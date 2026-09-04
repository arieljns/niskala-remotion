import type { ReactNode } from "react";
import { Sequence } from "remotion";

/**
 * One beat. A thin, deliberately-named wrapper around `<Sequence>` — Remotion
 * doesn't crossfade Sequences by default, but this makes the "hard cut, no
 * transition" rule explicit and impossible to accidentally soften later (no
 * one should ever wrap a `<HardCut>`'s children in an opacity animation that
 * spans the cut boundary). `layout="none"` opts out of Remotion's implicit
 * absolute-fill wrapper so nothing here can introduce its own transform.
 */
export function HardCut({
  from,
  durationInFrames,
  name,
  children,
}: {
  from: number;
  durationInFrames: number;
  name?: string;
  children: ReactNode;
}) {
  return (
    <Sequence from={from} durationInFrames={durationInFrames} name={name} layout="none">
      {children}
    </Sequence>
  );
}
