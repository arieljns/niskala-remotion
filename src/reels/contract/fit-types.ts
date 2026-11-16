/** Types shared by the browser-side measurement (reel01/fit.ts) and the node-side checks. No imports, so both can load it. */
export type FitKind = "sentence" | "hook" | "stop" | "punch" | "squash";
export type FitEntry = { path: string; kind: FitKind; readScale: number; widthPx: number };
