import { AbsoluteFill, Composition, Folder, Img } from "remotion";
import { storyFlat, storyFramed } from "../../assets";
import { SENJA } from "../../theme/senja";
import { Caption } from "../components/Caption";
import { ChatBubble } from "../components/chat/ChatBubble";
import { ChatCard, ChatCardRow } from "../components/chat/ChatCard";
import { ChatScreen, DateChip } from "../components/chat/ChatScreen";
import { TypingIndicator } from "../components/chat/TypingIndicator";
import { ContohChip } from "../components/ContohChip";
import { Highlight } from "../components/Highlight";
import { LaptopFrame } from "../components/LaptopFrame";
import { PhoneFrame } from "../components/PhoneFrame";
import { TapRipple } from "../components/TapRipple";
import { FontProof } from "./FontProof";
import { SenjaShowcase } from "./SenjaShowcase";

/**
 * Stage 2 harness: one composition per shared story component, so each can
 * be checked on its own in Studio. Coordinates here are rough test values —
 * the real, measured ones live in hotspots.ts.
 */
const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{ backgroundColor: SENJA.paper50, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 80 }}
  >
    {children}
  </AbsoluteFill>
);

const PHONE_W = 400;

const PhoneFrameTest: React.FC = () => (
  <Stage>
    <PhoneFrame src={storyFlat("04-cart")} width={PHONE_W} />
    {/* Reference framed PNG at the same scale, for a side-by-side check. */}
    <Img src={storyFramed("04-cart")} style={{ width: PHONE_W * (1659 / 1299) }} />
  </Stage>
);

const LaptopFrameTest: React.FC = () => (
  <Stage>
    <LaptopFrame src={storyFlat("07-admin-orders")} width={860} />
    <Img src={storyFramed("07-admin-orders")} style={{ width: 860 * (2880 / 2760) }} />
  </Stage>
);

const CaptionTest: React.FC = () => (
  <Stage>
    <LaptopFrame src={storyFlat("03-storefront-home")} width={1300} />
    <Caption text="Etalase sendiri, dengan merek Anda sendiri." startFrame={10} />
  </Stage>
);

const HighlightTest: React.FC = () => (
  <Stage>
    <PhoneFrame src={storyFlat("04-cart")} width={PHONE_W}>
      <Highlight rect={{ x: 33, y: 574, width: 327, height: 26, radius: 6 }} startFrame={15} />
    </PhoneFrame>
  </Stage>
);

const TapRippleTest: React.FC = () => (
  <Stage>
    <PhoneFrame src={storyFlat("04-cart")} width={PHONE_W}>
      <TapRipple x={197} y={761} startFrame={20} />
    </PhoneFrame>
  </Stage>
);

const ContohChipTest: React.FC = () => (
  <Stage>
    <LaptopFrame src={storyFlat("10-admin-revenue")} width={1300} />
    <ContohChip />
  </Stage>
);

const ChatPhone: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Stage>
    <PhoneFrame width={PHONE_W}>
      <ChatScreen>{children}</ChatScreen>
    </PhoneFrame>
  </Stage>
);

const ChatBubbleTest: React.FC = () => (
  <ChatPhone>
    <DateChip>Selasa, 13 Okt</DateChip>
    <ChatBubble side="in" time="10.15" startFrame={10}>
      Halo Kak Rika, pembayaran <b>#TA-10482</b> sudah kami terima. Terima kasih sudah belanja langsung di toko kami!
    </ChatBubble>
    <ChatBubble side="out" time="09.30" startFrame={35}>
      Wah cepet banget, makasih kak!
    </ChatBubble>
  </ChatPhone>
);

const ChatCardTest: React.FC = () => (
  <ChatPhone>
    <ChatCard tone="accent" eyebrow="Pesanan dikonfirmasi" title="#TA-10482 · Dikemas hari ini" time="10.15" startFrame={10}>
      <ChatCardRow label="Total dibayar" value="Rp118.000" />
    </ChatCard>
    <ChatCard tone="ink" eyebrow="Sudah dikirim" title="Paket dalam perjalanan" time="09.21" startFrame={35}>
      <ChatCardRow label="No. resi" value="TA2410 8812 4471" />
      <ChatCardRow label="Estimasi tiba" value="Kamis, 15 Okt" />
    </ChatCard>
  </ChatPhone>
);

const TypingIndicatorTest: React.FC = () => (
  <ChatPhone>
    <TypingIndicator style={{ alignSelf: "flex-start" }} />
    <ChatBubble side="in" time="10.15" startFrame={60} typingFrames={40}>
      Typing for 40 frames, then this lands in the same slot.
    </ChatBubble>
  </ChatPhone>
);

const TESTS: [string, React.FC][] = [
  ["PhoneFrame", PhoneFrameTest],
  ["LaptopFrame", LaptopFrameTest],
  ["Caption", CaptionTest],
  ["Highlight", HighlightTest],
  ["TapRipple", TapRippleTest],
  ["ContohChip", ContohChipTest],
  ["ChatBubble", ChatBubbleTest],
  ["ChatCard", ChatCardTest],
  ["TypingIndicator", TypingIndicatorTest],
  ["FontProof", FontProof],
];

export const StoryComponentTests: React.FC = () => (
  <Folder name="StoryComponents">
    {TESTS.map(([name, component]) => (
      <Composition
        key={name}
        id={`Test-${name}`}
        component={component}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
    ))}
    {(
      [
        ["Senja-Night", "night", 1920, 1080],
        ["Senja-Paper", "paper", 1920, 1080],
        ["Senja-Sunset", "sunset", 1920, 1080],
        ["Senja-Night-Vertical", "night", 1080, 1920],
      ] as const
    ).map(([name, kind, width, height]) => (
      <Composition
        key={name}
        id={`Test-${name}`}
        component={SenjaShowcase}
        defaultProps={{ kind }}
        durationInFrames={90}
        fps={30}
        width={width}
        height={height}
      />
    ))}
  </Folder>
);
