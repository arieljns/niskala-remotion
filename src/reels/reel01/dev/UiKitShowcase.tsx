import { AbsoluteFill, useCurrentFrame } from "remotion";
import { MistBackground } from "../../Backgrounds";
import { useReelFonts } from "../../useReelFonts";
import { CheckoutPage, CHECKOUT_SCROLL } from "../../ui/ios/CheckoutPage";
import { DmBubble, FollowerToast, IosNotification, ProfileHeaderCard, SafariUrlBar } from "../../ui/ios/Floating";
import { IgProductPage } from "../../ui/ios/IgProductPage";
import { BrowserSkeleton, InAppBrowser } from "../../ui/ios/InAppBrowser";
import { BarVariant, PhoneShell } from "../../ui/ios/PhoneShell";
import { ProductSheet } from "../../ui/ios/ProductSheet";
import { ProfileScreen } from "../../ui/ios/ProfileScreen";
import { PromoBadge } from "../../ui/ios/PromoBadge";
import { ProductTagPill, ReelScreen } from "../../ui/ios/ReelScreen";
import { StorePage } from "../../ui/ios/StorePage";
import { SuccessScreen } from "../../ui/ios/SuccessScreen";
import { PHONE_OUTER } from "../../ui/ios/tokens";

const SCALE = 0.56;
const CELL = { width: PHONE_OUTER.width * SCALE + 24, height: PHONE_OUTER.height * SCALE + 44 };

const Phone: React.FC<{ label: string; bar?: BarVariant; children: React.ReactNode }> = ({ label, bar, children }) => (
  <div style={{ width: CELL.width, height: CELL.height }}>
    <div style={{ fontSize: 15, fontFamily: "monospace", height: 22, color: "#2A1420" }}>{label}</div>
    <div style={{ width: PHONE_OUTER.width, height: PHONE_OUTER.height, transform: `scale(${SCALE})`, transformOrigin: "0 0" }}>
      <PhoneShell bar={bar}>{children}</PhoneShell>
    </div>
  </div>
);

const Dim: React.FC = () => <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)" }} />;

/** Dev only. Every kit component and state, for reviewing realism before it goes in the reel. */
export const UiKitShowcase: React.FC = () => {
  const ready = useReelFonts();
  const frame = useCurrentFrame();
  if (!ready) {
    return null;
  }
  return (
    <AbsoluteFill>
      <MistBackground />
      <div style={{ position: "absolute", inset: 16, display: "flex", flexWrap: "wrap", alignContent: "flex-start" }}>
        <Phone label="ProfileScreen"><ProfileScreen /></Phone>
        <Phone label="ReelScreen" bar="light"><ReelScreen /></Phone>
        <Phone label="Pill idle" bar="light"><ReelScreen pill={{ pop: 1 }} /></Phone>
        <Phone label="ProductSheet" bar="light"><ReelScreen pill={{ pop: 1 }} /><Dim /><ProductSheet /></Phone>
        <Phone label="IgProductPage"><IgProductPage /></Phone>
        <Phone label="Skeleton"><InAppBrowser progress={0.3}><BrowserSkeleton /></InAppBrowser></Phone>
        <Phone label="StorePage"><InAppBrowser progress={0.7}><StorePage /></InAppBrowser></Phone>
        <Phone label="Checkout top"><InAppBrowser><CheckoutPage /></InAppBrowser></Phone>
        <Phone label="Checkout end"><InAppBrowser><CheckoutPage scroll={CHECKOUT_SCROLL} /></InAppBrowser></Phone>
        <Phone label="Success"><InAppBrowser><SuccessScreen /></InAppBrowser></Phone>
        <div style={{ width: 800, display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
          <div style={{ position: "relative", width: 300, height: 56, background: "#3A2A1F" }}>
            <div style={{ position: "absolute", left: 0, top: -650 }}><ProductTagPill pop={1} /></div>
          </div>
          <div style={{ position: "relative", width: 300, height: 56, background: "#3A2A1F" }}>
            <div style={{ position: "absolute", left: 0, top: -650 }}><ProductTagPill pop={1} press={1} /></div>
          </div>
          <div style={{ padding: 12, background: "#8A7F78" }}>
            <IosNotification />
          </div>
          <FollowerToast />
          <DmBubble />
          <ProfileHeaderCard />
          <ProfileHeaderCard followed={1} />
          <SafariUrlBar />
          <div style={{ width: 560, height: 110 }}><PromoBadge kind="flash" /></div>
          <div style={{ width: 620, height: 110 }}><PromoBadge kind="kembar" /></div>
          <div style={{ width: 420, height: 110 }}><PromoBadge kind="ongkir" /></div>
        </div>
      </div>
      <div style={{ position: "absolute", right: 16, top: 12, fontFamily: "monospace", color: "#2A1420" }}>{frame}</div>
    </AbsoluteFill>
  );
};
