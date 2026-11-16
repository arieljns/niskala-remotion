/** Reads a WAV header: sample rate, channels, length. No ffmpeg needed, so checks stay fast. */
import { readFileSync } from "node:fs";

export type WavInfo = { sampleRate: number; channels: number; bitsPerSample: number; seconds: number };

export function wavInfo(path: string): WavInfo | null {
  const buf = readFileSync(path);
  if (buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") return null;
  let offset = 12;
  let fmt: { channels: number; sampleRate: number; bits: number } | null = null;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "fmt ")
      fmt = {
        channels: buf.readUInt16LE(offset + 10),
        sampleRate: buf.readUInt32LE(offset + 12),
        bits: buf.readUInt16LE(offset + 22),
      };
    if (id === "data" && fmt) {
      const bytesPerSecond = fmt.sampleRate * fmt.channels * (fmt.bits / 8);
      // A streamed file can declare size 0 or 0xFFFFFFFF; fall back to what is actually there.
      const bytes =
        size === 0 || size === 0xffffffff || offset + 8 + size > buf.length ? buf.length - offset - 8 : size;
      return {
        sampleRate: fmt.sampleRate,
        channels: fmt.channels,
        bitsPerSample: fmt.bits,
        seconds: bytes / bytesPerSecond,
      };
    }
    offset += 8 + size + (size % 2);
  }
  return null;
}
