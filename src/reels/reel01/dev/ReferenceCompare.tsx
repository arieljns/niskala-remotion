import { AbsoluteFill, Img, staticFile } from "remotion";
import { useReelFonts } from "../../useReelFonts";
import { CHECKOUT_SCROLL, CheckoutPage } from "../../ui/ios/CheckoutPage";
import { IgProductPage } from "../../ui/ios/IgProductPage";
import { InAppBrowser } from "../../ui/ios/InAppBrowser";
import { BarVariant, PhoneShell } from "../../ui/ios/PhoneShell";
import { ProductSheet } from "../../ui/ios/ProductSheet";
import { ReelScreen } from "../../ui/ios/ReelScreen";
import { StorePage } from "../../ui/ios/StorePage";
import { SuccessScreen } from "../../ui/ios/SuccessScreen";
import { PHONE_OUTER } from "../../ui/ios/tokens";

const HEIGHT = 1000;
const SCALE = HEIGHT / PHONE_OUTER.height;
const PAIRS: readonly { file: string; bar?: BarVariant; screen: React.ReactNode }[] = [
  { file: "mockup_01_reel.png", bar: "light", screen: <ReelScreen pill={{ pop: 1 }} /> },
  {
    file: "mockup_02_sheet.png",
    bar: "light",
    screen: (
      <>
        <ReelScreen pill={{ pop: 1 }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)" }} />
        <ProductSheet />
      </>
    ),
  },
  { file: "mockup_03_product_page.png", screen: <IgProductPage /> },
  { file: "mockup_04_store_page.png", screen: <InAppBrowser><StorePage /></InAppBrowser> },
  { file: "mockup_05_checkout.png", screen: <InAppBrowser><CheckoutPage scroll={CHECKOUT_SCROLL} /></InAppBrowser> },
  { file: "mockup_06_payment_success.png", screen: <InAppBrowser><SuccessScreen /></InAppBrowser> },
];

/** Dev only, and the only place the reference mockups are ever loaded. One pair per frame. */
export const ReferenceCompare: React.FC = () => {
  const ready = useReelFonts();
  if (!ready) {
    return null;
  }
  return (
    <AbsoluteFill style={{ backgroundColor: "#F4F0EC" }}>
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(2, 1fr)" }}>
        {PAIRS.map(({ file, bar, screen }) => (
          <div key={file} style={{ display: "flex", gap: 20, alignItems: "center", justifyContent: "center" }}>
            <Img src={staticFile(`reels/reel01-pack/reel01/reference/${file}`)} style={{ height: HEIGHT }} />
            <div style={{ width: PHONE_OUTER.width * SCALE, height: HEIGHT }}>
              <div style={{ width: PHONE_OUTER.width, height: PHONE_OUTER.height, transform: `scale(${SCALE})`, transformOrigin: "0 0" }}>
                <PhoneShell bar={bar} shadow={false}>{screen}</PhoneShell>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
