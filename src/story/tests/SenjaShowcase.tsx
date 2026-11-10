import { useCurrentFrame } from "remotion";
import { storyFlat } from "../../assets";
import { FONTS } from "../../theme/fonts";
import type { SurfaceKind } from "../../theme/senja";
import { useLayout } from "../../useLayout";
import { Caption } from "../components/Caption";
import { Highlight } from "../components/Highlight";
import { LaptopFrame } from "../components/LaptopFrame";
import { PhoneFrame } from "../components/PhoneFrame";
import { DIRECT_PRICE_BADGE_03, SETIA5_BANNER_02 } from "../hotspots";
import { ArrowChip, BrandLogo, CtaPill, GlassPanel } from "../senja/Chrome";
import { StickerTag } from "../senja/StickerTag";
import { Surface } from "../senja/Surface";
import { settledTilt } from "../senja/tilt";
import { Vault } from "../senja/Vault";

/**
 * Step 5–6 harness: every Niskala-layer piece on one surface. Registered once
 * per surface (and Night again at 9:16) so the three can be compared.
 * Copy here is placeholder showcase text, not story copy.
 */
const COPY: Record<SurfaceKind, { caption: string; sub: string; tag: string }> = {
  night: { caption: "Satu perubahan algoritma, kunjungan **turun 58%**.", sub: "Sub-line Lexend 300, opsional.", tag: "−58%" },
  paper: { caption: "Kontak pembeli **tersimpan di toko Anda sendiri**.", sub: "Sub-line Lexend 300, opsional.", tag: "Kontaknya milik Anda." },
  sunset: { caption: "Pembeli yang puas kembali lagi. **Pendapatan ikut tumbuh.**", sub: "", tag: "6,6x" },
};

export const SenjaShowcase: React.FC<{ kind: SurfaceKind }> = ({ kind }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const { width: W, height: H, isPortrait } = layout;
  const copy = COPY[kind];
  const tilt = settledTilt(frame, 50, kind === "paper" ? 0 : -6, layout);

  const deviceX = isPortrait ? W * 0.5 : W * 0.7;
  const phoneW = isPortrait ? W * 0.5 : H * 0.42;
  const laptopW = isPortrait ? W * 0.92 : W * 0.5;

  return (
    <Surface kind={kind} glowFrom={20}>
      <div style={{ position: "absolute", left: W * 0.06, top: isPortrait ? H * 0.025 : H * 0.045, zIndex: 50 }}>
        <BrandLogo size={isPortrait ? 30 : 26} />
      </div>

      <Vault centerX={deviceX} top={isPortrait ? H * 0.46 : H * 0.24} width={isPortrait ? W * 0.84 : W * 0.4} fill={kind === "sunset" ? "glass" : "grad"} />

      {kind === "paper" ? (
        <div style={{ position: "absolute", left: deviceX - laptopW / 2, top: isPortrait ? H * 0.5 : H * 0.3 }}>
          <LaptopFrame src={storyFlat("03-storefront-home")} width={laptopW} contoh>
            <Highlight rect={DIRECT_PRICE_BADGE_03} startFrame={30} padding={5} />
          </LaptopFrame>
        </div>
      ) : (
        <div style={{ position: "absolute", left: deviceX - phoneW / 2, top: isPortrait ? H * 0.38 : H * 0.12 }}>
          <PhoneFrame src={storyFlat("02-first-visit-home")} width={phoneW} tilt={tilt} contoh>
            <Highlight rect={SETIA5_BANNER_02} startFrame={30} />
          </PhoneFrame>
        </div>
      )}

      <StickerTag
        text={copy.tag}
        x={isPortrait ? W * 0.08 : deviceX + W * 0.08}
        y={isPortrait ? H * 0.42 : H * 0.16}
        rotate={kind === "paper" ? 5 : -5}
        startFrame={36}
      />

      <Caption text={copy.caption} sub={copy.sub || undefined} startFrame={6} />

      {kind === "night" && !isPortrait ? (
        <div style={{ position: "absolute", left: W * 0.06, bottom: H * 0.07, zIndex: 50 }}>
          <CtaPill label="Chat via WhatsApp" scale={isPortrait ? 1 : 0.9} />
        </div>
      ) : null}
      {kind === "paper" ? (
        <div style={{ position: "absolute", left: W * 0.06, bottom: H * 0.08, zIndex: 50 }}>
          <ArrowChip />
        </div>
      ) : null}
      {kind === "sunset" ? (
        // Small text on sunset sits on glass, inside the top/left 60%.
        <GlassPanel style={{ position: "absolute", left: W * 0.06, top: H * 0.48, width: W * 0.3, zIndex: 50 }}>
          <div style={{ fontFamily: FONTS.body, fontWeight: 300, fontSize: 24, lineHeight: 1.45 }}>
            Teks kecil di Sunset selalu di atas panel kaca.
          </div>
        </GlassPanel>
      ) : null}
    </Surface>
  );
};
