import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONTS } from "../../theme/fonts";
import { SENJA, SENJA_GRADIENTS } from "../../theme/senja";
import { TapRipple } from "../TapRipple";
import { COLORS, EASINGS, FOCAL, SHADOWS } from "../tokens";
import { IosNotification, NOTIFICATION } from "../ui/ios/Floating";
import { PhoneShell } from "../ui/ios/PhoneShell";
import {
  PHONE,
  PHONE_OUTER,
  INTER,
  SHEET_SPRING,
  pressAmount,
  pressStyle,
} from "../ui/ios/tokens";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CLAMP_BRAND = { ...CLAMP, easing: EASINGS.brand } as const;
const MOCKUPS = "assets/niskala-toko-anda-mockups/flat";

/** Where the visual sits under the pinned headlines. */
export const STAGE_TOP = 600;

// ---------------------------------------------------------------------------
// Hook: a lock screen filling up with order notifications.

const ORDERS = [
  "Kaos polos hitam · Rp89.000",
  "Tumbler 500 ml · Rp129.000",
  "Kaos polos putih · Rp89.000",
  "Tas selempang · Rp159.000",
  "Tumbler 500 ml · Rp129.000",
  "Kaos oversize · Rp99.000",
  "Botol minum 1 L · Rp75.000",
  "Kaos polos hitam · Rp89.000",
] as const;
/** Fits the phone between the stage top and the safe zone's bottom (874 px tall at 1). */
const PHONE_SCALE = 1;
const NOTIF_GAP = 84;
/** Burst: one banner every BURST_EVERY frames until the pull-out, then a calmer trickle. */
const BURST_EVERY = 3;
const TRICKLE_EVERY = 10;
/** Camera starts in on the banner stack, then pulls out to the whole phone. */
const CLOSE_ZOOM = 1.45;
const CLOSE_ON = { x: FOCAL.x, y: 1100 } as const;
const PULL_OUT_FRAMES = 16;

/** Frames the banners land on, local to the hook scene. */
export function hookArrivals(pullOutAt: number, end: number): number[] {
  const frames: number[] = [];
  for (let frame = 2; frame < pullOutAt; frame += BURST_EVERY)
    frames.push(frame);
  for (
    let frame = pullOutAt + PULL_OUT_FRAMES;
    frame < end;
    frame += TRICKLE_EVERY
  )
    frames.push(frame);
  return frames;
}

export const HookPhone: React.FC<{
  arrivals: readonly number[];
  pullOutAt: number;
}> = ({ arrivals, pullOutAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zoom = interpolate(
    frame,
    [pullOutAt, pullOutAt + PULL_OUT_FRAMES],
    [CLOSE_ZOOM, 1],
    CLAMP_BRAND,
  );
  /* Rattles while the burst lands, like a phone that won't stop buzzing. */
  const shake =
    frame < pullOutAt
      ? [
          [6, -4],
          [-5, 3],
          [4, 5],
          [-3, -5],
        ][frame % 4]
      : [0, 0];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transformOrigin: `${CLOSE_ON.x}px ${CLOSE_ON.y}px`,
        transform: `translate(${shake[0]}px, ${shake[1]}px) scale(${zoom})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: FOCAL.x - (PHONE_OUTER.width * PHONE_SCALE) / 2,
          top: STAGE_TOP - 20,
          transformOrigin: "0 0",
          transform: `scale(${PHONE_SCALE})`,
        }}
      >
        <PhoneShell bar="light">
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(170deg, ${SENJA.plum700} 0%, ${SENJA.plum900} 55%, ${SENJA.night} 100%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 92,
              width: PHONE.width,
              textAlign: "center",
              color: "#FFF",
              fontFamily: FONTS.body,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 500, opacity: 0.85 }}>
              Jumat, 13 November
            </div>
            <div
              style={{
                fontSize: 86,
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              09.41
            </div>
          </div>
          {arrivals.map((at, index) => {
            if (frame < at) {
              return null;
            }
            const newer =
              arrivals.filter((other) => frame >= other).length - 1 - index;
            if (newer > 6) {
              return null;
            }
            const drop = spring({
              frame: frame - at,
              fps,
              config: SHEET_SPRING,
            });
            const settledY = 250 + newer * NOTIF_GAP;
            return (
              <div
                key={at}
                style={{
                  position: "absolute",
                  left: NOTIFICATION.x,
                  top: 0,
                  transform: `translateY(${interpolate(drop, [0, 1], [150, settledY])}px) scale(${interpolate(drop, [0, 1], [0.9, 1])})`,
                  opacity:
                    interpolate(drop, [0, 0.3], [0, 1], CLAMP) *
                    (newer > 5 ? 0.4 : 1),
                }}
              >
                <IosNotification
                  title="Pesanan baru masuk"
                  body={ORDERS[index % ORDERS.length]}
                />
              </div>
            );
          })}
        </PhoneShell>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Iklan: the ad report says one thing, the balance says another.

const CARD_WIDTH = 820;

const MoneyCard: React.FC<{
  label: string;
  amount: string;
  note: string;
  noteColor: string;
  style?: React.CSSProperties;
}> = ({ label, amount, note, noteColor, style }) => (
  <div
    style={{
      position: "absolute",
      width: CARD_WIDTH,
      boxSizing: "border-box",
      padding: "44px 52px 48px",
      borderRadius: 44,
      background: COLORS.card,
      boxShadow: SHADOWS.card,
      color: COLORS.ink,
      ...style,
    }}
  >
    <div
      style={{
        fontFamily: FONTS.body,
        fontSize: 38,
        fontWeight: 500,
        color: SENJA.muted,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: FONTS.display,
        fontStretch: "112%",
        fontWeight: 800,
        fontSize: 150,
        letterSpacing: "-0.04em",
        lineHeight: 1.05,
        marginTop: 10,
      }}
    >
      {amount}
    </div>
    <div
      style={{
        fontFamily: FONTS.body,
        fontSize: 36,
        fontWeight: 600,
        color: noteColor,
        marginTop: 8,
      }}
    >
      {note}
    </div>
  </div>
);

export const AdVsSaldo: React.FC<{
  adIn: number;
  saldoIn: number;
  saldoLand: number;
}> = ({ adIn, saldoIn, saldoLand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ad = spring({ frame: frame - adIn, fps, config: SHEET_SPRING });
  const saldo = spring({ frame: frame - saldoIn, fps, config: SHEET_SPRING });
  const left = FOCAL.x - CARD_WIDTH / 2;
  /* Push in on the balance when "nggak segitu" lands. */
  const zoom = interpolate(
    frame,
    [saldoLand, saldoLand + 12],
    [1, 1.03],
    CLAMP_BRAND,
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transformOrigin: `${FOCAL.x}px 1240px`,
        transform: `scale(${zoom})`,
      }}
    >
      {frame >= adIn ? (
        <MoneyCard
          label="Penjualan dari iklan"
          amount="Rp8,4 jt"
          note="▲ naik terus"
          noteColor="#1F8A4C"
          style={{
            left,
            top: STAGE_TOP + 60,
            opacity:
              interpolate(ad, [0, 0.35], [0, 1], CLAMP) *
              interpolate(saldo, [0, 1], [1, 0.45]),
            transform: `translateY(${(1 - ad) * 200}px) scale(${interpolate(saldo, [0, 1], [1, 0.94])})`,
          }}
        />
      ) : null}
      {frame >= saldoIn ? (
        <MoneyCard
          label="Saldo yang masuk"
          amount="Rp2,1 jt"
          note="segini doang?"
          noteColor={COLORS.accent}
          style={{
            left,
            top: STAGE_TOP + 420,
            opacity: interpolate(saldo, [0, 0.35], [0, 1], CLAMP),
            transform: `translateY(${(1 - saldo) * 260}px)`,
            boxShadow: `${SHADOWS.card}, 0 0 0 4px ${COLORS.accent}`,
          }}
        />
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sepi: the store statistics page, zooming into the day traffic fell.

const DASH = { width: 2420, height: 1512 } as const;
/** Safe zone is 876 px wide. */
const DASH_SHOWN_WIDTH = 860;
/* The drop point on the chart, as a fraction of the image. */
const DROP_POINT = { x: 1830 / DASH.width, y: 520 / DASH.height } as const;

export const DashboardDrop: React.FC<{ inAt: number; zoomAt: number }> = ({
  inAt,
  zoomAt,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - inAt, fps, config: SHEET_SPRING });
  const height = (DASH_SHOWN_WIDTH * DASH.height) / DASH.width;
  const zoom = interpolate(frame, [zoomAt, zoomAt + 18], [1, 2.3], CLAMP_BRAND);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: FOCAL.x - DASH_SHOWN_WIDTH / 2,
          top: STAGE_TOP + 140,
          width: DASH_SHOWN_WIDTH,
          height,
          borderRadius: 28,
          overflow: "hidden",
          background: "#FFF",
          boxShadow: SHADOWS.card,
          opacity: interpolate(enter, [0, 0.35], [0, 1], CLAMP),
          transform: `translateY(${(1 - enter) * 220}px)`,
        }}
      >
        <Img
          src={staticFile(`${MOCKUPS}/dashboard-statistik.jpg`)}
          style={{
            width: "100%",
            height: "100%",
            transformOrigin: `${DROP_POINT.x * 100}% ${DROP_POINT.y * 100}%`,
            transform: `scale(${zoom})`,
          }}
        />
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Gigit: Rp100.000 with two bites taken out of it, admin then iklan.

const BITE_CARD = { width: 860, height: 500 } as const;
const BITE_R = 150;
/** How deep each bite has eaten into the card, as a share of its width (about 28 % + 15 %). */
const BITES = [
  { depth: 0.28, ys: [0.12, 0.45, 0.8], label: "admin" },
  { depth: 0.43, ys: [0.28, 0.62, 0.98], label: "iklan" },
] as const;

export const BiteCard: React.FC<{
  inAt: number;
  tenseAt: number;
  biteAt: readonly [number, number];
}> = ({ inAt, tenseAt, biteAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - inAt, fps, config: SHEET_SPRING });
  const { width, height } = BITE_CARD;
  /* A small wobble on "digigit", before anything is taken. */
  const tense =
    frame >= tenseAt && frame < tenseAt + 10
      ? Math.sin((frame - tenseAt) * 2.4) * 6
      : 0;
  const bitten = biteAt.map((at) => frame >= at);
  const jolt = biteAt.reduce(
    (sum, at) =>
      sum + (frame >= at && frame < at + 4 ? [14, -10, 6, -3][frame - at] : 0),
    0,
  );
  const left = FOCAL.x - width / 2;
  const top = STAGE_TOP + 170;

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        opacity: interpolate(enter, [0, 0.35], [0, 1], CLAMP),
        transform: `translate(${tense + jolt}px, ${(1 - enter) * 240}px)`,
      }}
    >
      <svg
        width={width}
        height={height}
        style={{
          position: "absolute",
          overflow: "visible",
          filter: "drop-shadow(0 30px 40px rgba(42,20,32,.25))",
        }}
      >
        <defs>
          <mask id="reel02-bites">
            <rect x={0} y={0} width={width} height={height} fill="#FFF" />
            {BITES.map((bite, index) =>
              bitten[index]
                ? bite.ys.map((y) => (
                    <circle
                      key={`${bite.label}-${y}`}
                      cx={width * (1 - bite.depth) + BITE_R}
                      cy={height * y}
                      r={BITE_R}
                      fill="#000"
                    />
                  ))
                : null,
            )}
          </mask>
        </defs>
        <g mask="url(#reel02-bites)">
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={48}
            fill={SENJA.cream100}
          />
          <rect
            x={22}
            y={22}
            width={width - 44}
            height={height - 44}
            rx={34}
            fill="none"
            stroke={SENJA.amber400}
            strokeWidth={4}
            strokeDasharray="14 12"
          />
          <text
            x={64}
            y={150}
            fontFamily={FONTS.body}
            fontSize={40}
            fontWeight={500}
            fill={SENJA.muted}
          >
            Uang masuk
          </text>
          <text
            x={58}
            y={310}
            fontFamily={FONTS.display}
            fontSize={136}
            fontWeight={800}
            letterSpacing="-0.04em"
            fill={COLORS.ink}
          >
            Rp100.000
          </text>
        </g>
      </svg>
      {BITES.map((bite, index) => {
        const at = biteAt[index];
        if (frame < at) {
          return null;
        }
        const pop = spring({
          frame: frame - at,
          fps,
          config: { damping: 14, stiffness: 260, mass: 0.8 },
        });
        return (
          <div
            key={bite.label}
            style={{
              position: "absolute",
              right: 10,
              top: index === 0 ? -110 : height + 30,
              padding: "14px 30px",
              borderRadius: 999,
              background: COLORS.accent,
              color: "#FFF",
              fontFamily: FONTS.display,
              fontWeight: 800,
              fontSize: 54,
              letterSpacing: "-0.02em",
              boxShadow: SHADOWS.punchGlow,
              transform: `scale(${pop})`,
              whiteSpace: "nowrap",
            }}
          >
            − {bite.label}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Teaser: the customer list the platform keeps blurred.

const TEASER_SCALE = 0.98;

export const BlurredCustomers: React.FC<{ pushAt: number }> = ({ pushAt }) => {
  const frame = useCurrentFrame();
  const push = interpolate(
    frame,
    [0, pushAt, pushAt + 60],
    [1, 1.01, 1.05],
    CLAMP_BRAND,
  );

  return (
    <div
      style={{
        position: "absolute",
        left: FOCAL.x - (PHONE_OUTER.width * TEASER_SCALE) / 2,
        top: STAGE_TOP - 20,
        transformOrigin: "50% 30%",
        transform: `scale(${TEASER_SCALE * push})`,
      }}
    >
      <div style={{ transformOrigin: "0 0" }}>
        <PhoneShell>
          <Img
            src={staticFile(`${MOCKUPS}/pelanggan-disamarkan.jpg`)}
            style={{
              position: "absolute",
              inset: 0,
              width: PHONE.width,
              height: PHONE.height,
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
        </PhoneShell>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// CTA: Niskala's profile card, and the follow tap.

/** Card units are IG points; at this scale the card is 836 px wide, inside the safe zone. */
const CTA_SCALE = 2.2;
const IG_CARD = { width: 380, height: 352 } as const;
/** Copied from Niskala's real profile (screenshot 2026-11-13). Followers tick +1 on the tap. */
const IG_PROFILE = {
  name: "Niskala Works | Website Toko Online",
  category: "Website",
  bio: ["Bantu seller punya website toko sendiri.", "Cek dulu potongan marketplace-mu \u{1F447}"],
  link: "niskalaworks.dev/kalkulator",
  posts: 13,
  followers: 61,
  following: 7,
  highlights: ["Studi Kasus", "Tools Gratis", "Artikel"],
} as const;
const IG = {
  bg: "#0C1014",
  text: "#F5F5F5",
  muted: "#A8A8A8",
  link: "#A5B4FC",
  blue: "#4A5DF9",
  button: "#25292E",
  ring: "linear-gradient(45deg, #F4AE4A, #E8603F 45%, #9E3D5E)",
} as const;
const FOLLOW_BOX = { x: 16, y: 212, width: 170, height: 36 } as const;

const IgStat: React.FC<{ value: React.ReactNode; label: string }> = ({ value, label }) => (
  <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
    <span style={{ fontSize: 17, fontWeight: 700, height: 20, overflow: "hidden", position: "relative" }}>{value}</span>
    <span style={{ fontSize: 14, color: IG.text }}>{label}</span>
  </div>
);

/** 61 rolls up to 62 as `t` goes 0..1. */
const RollingCount: React.FC<{ from: number; t: number }> = ({ from, t }) => (
  <span style={{ display: "inline-block", transform: `translateY(${-20 * t}px)` }}>
    <span style={{ display: "block", height: 20 }}>{from}</span>
    <span style={{ display: "block", height: 20, color: t > 0.5 ? SENJA.amber400 : IG.text }}>{from + 1}</span>
  </span>
);

const IgProfileCard: React.FC<{ followed: number; press: number; ringSpin: number; countRoll: number }> = ({
  followed,
  press,
  ringSpin,
  countRoll,
}) => (
  <div
    style={{
      position: "relative",
      width: IG_CARD.width,
      height: IG_CARD.height,
      boxSizing: "border-box",
      padding: 16,
      borderRadius: 26,
      background: IG.bg,
      boxShadow: "0 34px 70px -24px rgba(42,20,32,.55), inset 0 0 0 1px rgba(255,255,255,.06)",
      fontFamily: INTER,
      color: IG.text,
      whiteSpace: "nowrap",
      overflow: "hidden",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: IG.ring, transform: `rotate(${ringSpin}deg)` }} />
        <div
          style={{
            position: "absolute",
            inset: 4,
            borderRadius: "50%",
            border: `3px solid ${IG.bg}`,
            background: `radial-gradient(circle at 70% 85%, ${SENJA.coral500} 0%, ${SENJA.berry500} 30%, ${SENJA.night} 70%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Img src={staticFile("reels/reel02/niskala-mark-cream.svg")} style={{ height: 46 }} />
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", width: 240 }}>
          {IG_PROFILE.name}
        </div>
        <div style={{ display: "flex", gap: 26 }}>
          <IgStat value={IG_PROFILE.posts} label="posts" />
          <IgStat value={<RollingCount from={IG_PROFILE.followers} t={countRoll} />} label="followers" />
          <IgStat value={IG_PROFILE.following} label="following" />
        </div>
      </div>
    </div>
    <div style={{ marginTop: 12, fontSize: 14, lineHeight: "19px" }}>
      <div style={{ color: IG.muted }}>{IG_PROFILE.category}</div>
      {IG_PROFILE.bio.map((line) => (
        <div key={line}>{line}</div>
      ))}
      <div style={{ color: IG.link, fontWeight: 600 }}>{"\u{1F517} "}{IG_PROFILE.link}</div>
    </div>
    <div
      style={{
        position: "absolute",
        left: FOLLOW_BOX.x,
        top: FOLLOW_BOX.y,
        width: FOLLOW_BOX.width,
        height: FOLLOW_BOX.height,
        borderRadius: 9,
        overflow: "hidden",
        fontSize: 15,
        fontWeight: 600,
        ...pressStyle(press),
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: IG.blue, opacity: 1 - followed, display: "flex", alignItems: "center", justifyContent: "center" }}>
        Follow
      </div>
      <div style={{ position: "absolute", inset: 0, background: IG.button, opacity: followed, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        Following <span style={{ fontSize: 11 }}>{"\u{2304}"}</span>
      </div>
    </div>
    <div
      style={{
        position: "absolute",
        left: FOLLOW_BOX.x + FOLLOW_BOX.width + 8,
        top: FOLLOW_BOX.y,
        width: IG_CARD.width - FOLLOW_BOX.width - 8 - FOLLOW_BOX.x * 2,
        height: FOLLOW_BOX.height,
        borderRadius: 9,
        background: IG.button,
        fontSize: 15,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      Message
    </div>
    <div style={{ position: "absolute", left: FOLLOW_BOX.x, top: FOLLOW_BOX.y + FOLLOW_BOX.height + 16, display: "flex", gap: 22 }}>
      {IG_PROFILE.highlights.map((label, index) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, width: 72 }}>
          <div style={{ width: 58, height: 58, borderRadius: "50%", padding: 2, boxSizing: "border-box", border: "1.5px solid #3A3F45" }}>
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: SENJA_GRADIENTS.glowNight([`${70 + index * 10}%`, "90%"]),
                backgroundColor: SENJA.night,
              }}
            />
          </div>
          <span style={{ fontSize: 12 }}>{label}</span>
        </div>
      ))}
    </div>
  </div>
);

export const FollowCard: React.FC<{ inAt: number; tapAt: number }> = ({ inAt, tapAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame: frame - inAt, fps, config: SHEET_SPRING });
  const followed = interpolate(frame, [tapAt + 4, tapAt + 10], [0, 1], CLAMP);
  /* The card answers the tap: a small kick up, then settles. */
  const kick = spring({ frame: frame - tapAt - 4, fps, config: { damping: 10, stiffness: 260, mass: 0.6 } });
  const bump = frame >= tapAt + 4 ? Math.sin(Math.min(1, kick) * Math.PI) * 0.025 : 0;
  const countRoll = interpolate(frame, [tapAt + 8, tapAt + 16], [0, 1], CLAMP_BRAND);
  const ringSpin = interpolate(frame, [inAt, inAt + 90], [0, 60], CLAMP);
  const scale = CTA_SCALE * (1 + bump);
  const width = IG_CARD.width * scale;

  return (
    <div
      style={{
        position: "absolute",
        left: FOCAL.x - width / 2,
        top: STAGE_TOP - 20 - (IG_CARD.height * (scale - CTA_SCALE)) / 2,
        transformOrigin: "0 0",
        transform: `translateY(${(1 - card) * 520}px) scale(${scale}) rotate(${(1 - card) * 4}deg)`,
        opacity: interpolate(card, [0, 0.35], [0, 1], CLAMP),
      }}
    >
      <IgProfileCard followed={followed} press={pressAmount(frame, tapAt)} ringSpin={ringSpin} countRoll={countRoll} />
      <TapRipple
        x={FOLLOW_BOX.x + FOLLOW_BOX.width / 2}
        y={FOLLOW_BOX.y + FOLLOW_BOX.height / 2}
        startFrame={tapAt}
        color={COLORS.cream}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tulang: a drumstick; the platform takes the meat, the seller is left the bone.

const MEAT_PATH =
  "M 250 40 C 360 30 430 110 420 200 C 410 290 330 330 270 360 L 215 300 C 180 260 120 220 110 160 C 95 80 160 45 250 40 Z";

export const MeatBone: React.FC<{
  inAt: number;
  takeAt: number;
  boneAt: number;
}> = ({ inAt, takeAt, boneAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < inAt) {
    return null;
  }
  const enter = spring({
    frame: frame - inAt,
    fps,
    config: { damping: 13, stiffness: 180, mass: 0.9 },
  });
  /* The meat leaves up and away, as if pulled off the bone. */
  const take = interpolate(frame, [takeAt, takeAt + 14], [0, 1], {
    ...CLAMP,
    easing: EASINGS.camera,
  });
  const bone = spring({
    frame: frame - boneAt,
    fps,
    config: { damping: 9, stiffness: 220, mass: 0.7 },
  });
  const boneOn = frame >= boneAt;
  const size = 480;

  return (
    <div
      style={{
        position: "absolute",
        left: FOCAL.x - size / 2,
        top: 1000,
        width: size,
        height: size,
        transform: `scale(${interpolate(enter, [0, 1], [0.6, 1])}) rotate(${interpolate(enter, [0, 1], [-18, -8])}deg)`,
        opacity: interpolate(enter, [0, 0.3], [0, 1], CLAMP),
      }}
    >
      <svg
        viewBox="0 0 520 520"
        width={size}
        height={size}
        style={{ overflow: "visible" }}
      >
        <defs>
          <radialGradient id="reel02-meat" cx="40%" cy="30%" r="75%">
            <stop offset="0%" stopColor={SENJA.amber400} />
            <stop offset="45%" stopColor={SENJA.coral500} />
            <stop offset="100%" stopColor={SENJA.berry500} />
          </radialGradient>
        </defs>
        {/* Bone: shaft plus two knobs, drawn under the meat. */}
        <g
          style={{
            transformOrigin: "300px 400px",
            transform: boneOn
              ? `scale(${interpolate(bone, [0, 1], [1.25, 1])})`
              : undefined,
            filter: boneOn
              ? `drop-shadow(0 0 ${interpolate(bone, [0, 1], [40, 18])}px rgba(255,233,190,.55))`
              : undefined,
          }}
        >
          <path
            d="M 230 270 L 380 420"
            stroke={SENJA.cream100}
            strokeWidth={56}
            strokeLinecap="round"
          />
          <circle cx={385} cy={455} r={38} fill={SENJA.cream100} />
          <circle cx={418} cy={420} r={38} fill={SENJA.cream100} />
        </g>
        <g
          style={{
            transformOrigin: "260px 200px",
            transform: `translate(${take * -260}px, ${take * -520}px) rotate(${take * -40}deg)`,
            opacity: 1 - take,
          }}
        >
          <path d={MEAT_PATH} fill="url(#reel02-meat)" />
          <path
            d="M 190 110 C 230 80 300 80 340 110"
            stroke="rgba(255,255,255,.35)"
            strokeWidth={14}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
};
