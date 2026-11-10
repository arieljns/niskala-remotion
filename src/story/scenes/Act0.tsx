import { Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { STORY_PAIN } from "../../assets";
import { easedInterpolate, STORY_SPRING } from "../../theme/motion";
import { useLayout, type Layout } from "../../useLayout";
import { Caption } from "../components/Caption";
import { Highlight } from "../components/Highlight";
import { PHONE_ASPECT, PhoneFrame } from "../components/PhoneFrame";
import { getVaultWindow, LaptopShotView, VaultWindow, WHOLE_IN_WINDOW } from "../components/VaultLaptop";
import { MASKED_COLUMN_PAIN, VISITS_CARD_PAIN, ZERO_CONTACTS_PAIN } from "../hotspots";
import { byOrientation } from "../laptopShot";
import { Surface } from "../senja/Surface";
import { settledTilt } from "../senja/tilt";
import { Vault } from "../senja/Vault";
import type { SceneComponent } from "./index";

/** Act 0 sits on Night. */
const SURFACE = "night";

/** Frame the ring lands on the "−58%" card in 0a. */
const DROP_AT = 40;

/**
 * 0a — the seller-center stats page. The camera pushes from the whole laptop
 * into the "Kunjungan −58%" card and the cliff in the chart beside it, then
 * the ring lands on the card. 9:16 crops straight into the card.
 */
const Scene0a: SceneComponent = ({ scene }) => {
  const layout = useLayout();
  const win = getVaultWindow(layout);

  return (
    <Surface kind={SURFACE} glowFrom={20}>
      <VaultWindow rect={win} contoh={scene.contohData}>
        <LaptopShotView
          src={STORY_PAIN.dashboardStatistik}
          from={byOrientation(layout, WHOLE_IN_WINDOW, { cx: 560, cy: 300, span: 900, anchorY: 0.4 })}
          to={byOrientation(layout, { cx: 520, cy: 270, span: 860, anchorY: 0.42 }, { cx: 375, cy: 268, span: 430, anchorY: 0.4 })}
          frames={[6, DROP_AT + 20]}
          viewportWidth={win.width}
          viewportHeight={win.height}
        >
          <Highlight rect={VISITS_CARD_PAIN} startFrame={DROP_AT} padding={5} />
        </LaptopShotView>
      </VaultWindow>
      <Caption text={scene.caption} startFrame={8} endFrame={scene.durationInFrames} />
    </Surface>
  );
};

/** One phone, right of the caption in 16:9 and below it in 9:16 (same stage as Act 4). */
function getPhoneStage(layout: Layout) {
  const { width: W, height: H } = layout;
  if (layout.isPortrait) {
    const phoneW = W * 0.56;
    return { cx: W * 0.5, top: H * 0.33, phoneW, vault: { centerX: W * 0.5, top: H * 0.44, width: W * 0.88 } };
  }
  const phoneW = H * 0.4;
  return { cx: W * 0.7, top: H * 0.09, phoneW, vault: { centerX: W * 0.7, top: H * 0.3, width: W * 0.38 } };
}

/** Frame the ring lands on the masked numbers in 0b. */
const MASKED_AT = 36;

/**
 * 0b — the marketplace's own customer list: 312 repeat buyers, every number
 * and address "Disamarkan". The phone rises in tilted, settles flat as the
 * ring lands on the masked column.
 */
const Scene0b: SceneComponent = ({ scene }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const stage = getPhoneStage(layout);
  const rise = easedInterpolate(frame, [0, 24], [1, 0]);
  const tilt = settledTilt(frame, MASKED_AT, 5, layout, 30);
  const phoneH = stage.phoneW * PHONE_ASPECT;
  // A slow drift down the list keeps the hold alive after the ring lands.
  const drift = easedInterpolate(frame, [MASKED_AT, scene.durationInFrames], [0, -phoneH * 0.02]);

  return (
    <Surface kind={SURFACE} glowFrom={24}>
      <Vault {...stage.vault} />
      <div
        style={{
          position: "absolute",
          left: stage.cx - stage.phoneW / 2,
          top: stage.top,
          transform: `translateY(${rise * layout.height * 0.3 + drift}px)`,
          opacity: 1 - rise,
        }}
      >
        <PhoneFrame src={STORY_PAIN.pelangganDisamarkan} width={stage.phoneW} tilt={tilt} contoh={scene.contohData}>
          <Highlight rect={MASKED_COLUMN_PAIN} startFrame={MASKED_AT} padding={6} />
        </PhoneFrame>
      </div>
      <Caption text={scene.caption} startFrame={8} endFrame={scene.durationInFrames} />
    </Surface>
  );
};

/** 0c beats: the suspend notification drops in, then the ring lands on the "0" and holds. */
const NOTIFY_AT = 10;
const ZERO_AT = 46;

/** The suspend notification PNG is 1179x300. */
const NOTIFY_ASPECT = 300 / 1179;

/**
 * 0c — "Toko dinonaktifkan sementara": the phone notification drops in over
 * the shot, then the camera pushes into the empty contacts page and the ring
 * holds on the big "0" for the rest of the scene.
 */
const Scene0c: SceneComponent = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const { width: W, height: H, isPortrait: portrait } = layout;
  const win = getVaultWindow(layout);

  const drop = spring({ frame: frame - NOTIFY_AT, fps, config: STORY_SPRING });
  const notifyW = portrait ? W * 0.8 : W * 0.25;
  const notify = portrait
    ? // Sits just above the window, clear of its "Contoh data" chip.
      { left: W * 0.5 - notifyW / 2, top: win.top - notifyW * NOTIFY_ASPECT - H * 0.008 }
    : { left: win.left - W * 0.05, top: win.top - H * 0.04 };

  return (
    <Surface kind={SURFACE} glowFrom={20}>
      <VaultWindow rect={win} contoh={scene.contohData}>
        <LaptopShotView
          src={STORY_PAIN.kontakKosong}
          from={byOrientation(layout, WHOLE_IN_WINDOW, { cx: 640, cy: 330, span: 1000, anchorY: 0.5 })}
          to={byOrientation(layout, { cx: 690, cy: 330, span: 820, anchorY: 0.5 }, { cx: 703, cy: 345, span: 470, anchorY: 0.5 })}
          frames={[NOTIFY_AT, ZERO_AT + 10]}
          viewportWidth={win.width}
          viewportHeight={win.height}
        >
          <Highlight rect={ZERO_CONTACTS_PAIN} startFrame={ZERO_AT} padding={8} />
        </LaptopShotView>
      </VaultWindow>
      {frame >= NOTIFY_AT ? (
        <Img
          src={STORY_PAIN.notifikasiSuspend}
          style={{
            position: "absolute",
            left: notify.left,
            top: notify.top,
            width: notifyW,
            height: notifyW * NOTIFY_ASPECT,
            zIndex: 30,
            // The PNG carries its own soft shadow; this lifts it off Night like a sticker tag.
            filter: "drop-shadow(0 14px 18px rgba(30,8,18,.55))",
            opacity: Math.min(1, drop * 1.4),
            transform: `translateY(${(1 - drop) * -H * 0.06}px) rotate(${portrait ? 0 : -2 * drop}deg)`,
          }}
        />
      ) : null}
      <Caption text={scene.caption} startFrame={8} endFrame={scene.durationInFrames} />
    </Surface>
  );
};

export const ACT0_SCENES = { "0a": Scene0a, "0b": Scene0b, "0c": Scene0c };
