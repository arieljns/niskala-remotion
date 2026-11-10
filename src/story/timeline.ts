import type { SurfaceKind } from "../theme/senja";
import { END_CARD_HEADLINE } from "./constants";

/**
 * Single source of truth for NiskalaStory timing and copy. Every act
 * composition and the assembled story read scene lengths and captions from
 * here, so retiming a scene is one number in this file.
 */
export const STORY_FPS = 30;

/** Slide + fade between scenes inside an act. */
export const SCENE_TRANSITION_FRAMES = 15;
/** Slide + fade between acts in the assembled story. */
export const ACT_TRANSITION_FRAMES = 20;

export interface SceneSpec {
  id: string;
  name: string;
  durationInFrames: number;
  /** Caption copy; at most one **accent phrase** (see Caption). */
  caption: string;
  /** Shows admin numbers or growth — must keep the "Contoh data" chip visible. */
  contohData?: boolean;
  /** How this scene arrives from the previous one in its act. Defaults to a
   *  slide + fade; "cut" is a hard cut on the beat (no overlap). */
  enter?: "slideFade" | "cut";
}

export interface ActSpec {
  id: "act0" | "act1" | "act2" | "act3" | "act4" | "act5";
  compositionId: string;
  title: string;
  /** Senja surface for every scene in the act. Acts alternate so no two
   *  neighbouring acts share a surface; Sunset appears once (Act 5). The
   *  end card (5b) overrides to Night. */
  surface: SurfaceKind;
  scenes: SceneSpec[];
}

export const ACTS: ActSpec[] = [
  {
    id: "act0",
    compositionId: "Act0Masalah",
    surface: "night",
    title: "Masalahnya",
    scenes: [
      { id: "0a", name: "Statistik turun", durationInFrames: 85, caption: "Satu perubahan algoritma, kunjungan **turun 58%**.", contohData: true },
      { id: "0b", name: "Pelanggan disamarkan", durationInFrames: 85, caption: "Pembeli setia ada, tapi **kontaknya bukan milik Anda**.", contohData: true },
      { id: "0c", name: "Kontak kosong", durationInFrames: 95, caption: "Kalau toko dinonaktifkan, **tidak ada yang bisa Anda sapa**.", contohData: true },
    ],
  },
  {
    id: "act1",
    compositionId: "Act1Bridge",
    surface: "paper",
    title: "Bertransaksi langsung",
    scenes: [
      {
        id: "1a",
        name: "Kartu terima kasih",
        durationInFrames: 130,
        caption: "Pembeli tetap datang dari marketplace. **Pesanan berikutnya**, langsung ke toko Anda.",
      },
      {
        id: "1b",
        name: "Kunjungan pertama",
        durationInFrames: 110,
        caption: "Kodenya sudah terpasang. **Tanpa daftar**, tanpa ribet.",
        // Match-cut from the QR sweep to the phone.
        enter: "cut",
      },
    ],
  },
  {
    id: "act2",
    compositionId: "Act2TokoSendiri",
    surface: "night",
    title: "Toko sendiri",
    scenes: [
      { id: "2a", name: "Etalase", durationInFrames: 160, caption: "**Etalase sendiri**, dengan merek Anda sendiri." },
      {
        id: "2b",
        name: "Keranjang, checkout, berhasil",
        durationInFrames: 215,
        caption: "Belanja di toko Anda sendiri: rapi, cepat, **tanpa potongan platform**.",
      },
    ],
  },
  {
    id: "act3",
    compositionId: "Act3Terkelola",
    surface: "paper",
    title: "Semua terkelola",
    scenes: [
      { id: "3a", name: "Pesanan masuk", durationInFrames: 100, caption: "Setiap pesanan **masuk ke dasbor Anda**.", contohData: true },
      {
        id: "3b",
        name: "Detail pesanan",
        durationInFrames: 110,
        caption: "Pengiriman terlacak, **pelanggan dikabari otomatis**.",
        contohData: true,
      },
      {
        id: "3c",
        name: "Kontak: disamarkan vs milik Anda",
        durationInFrames: 165,
        caption: "Kontak pembeli **tersimpan di toko Anda sendiri**.",
        contohData: true,
      },
      { id: "3d", name: "Pendapatan harian", durationInFrames: 100, caption: "Pendapatan **terlihat jelas**, setiap hari.", contohData: true },
    ],
  },
  {
    id: "act4",
    compositionId: "Act4PembeliPuas",
    surface: "night",
    title: "Pembeli puas",
    scenes: [
      { id: "4a", name: "Konfirmasi pesanan", durationInFrames: 95, caption: "Konfirmasi dan resi **langsung ke pembeli**." },
      { id: "4b", name: "Pesanan tiba", durationInFrames: 80, caption: "Pesanan tiba, **seperti yang dijanjikan**." },
      { id: "4c", name: "Ulasan", durationInFrames: 85, caption: "Pembeli puas, **dan bilang begitu**." },
      { id: "4d", name: "Beli lagi", durationInFrames: 95, caption: "Lalu mereka kembali, **langsung ke Anda**." },
    ],
  },
  {
    id: "act5",
    compositionId: "Act5Pertumbuhan",
    surface: "sunset",
    title: "Pertumbuhan",
    scenes: [
      {
        id: "5a",
        name: "Pertumbuhan bulanan",
        durationInFrames: 160,
        caption: "Pembeli yang puas kembali lagi. **Pendapatan ikut tumbuh.**",
        contohData: true,
      },
      { id: "5b", name: "End card", durationInFrames: 150, caption: END_CARD_HEADLINE },
    ],
  },
];

export function getActs(showPainIntro: boolean): ActSpec[] {
  return showPainIntro ? ACTS : ACTS.filter((act) => act.id !== "act0");
}

export function getAct(id: ActSpec["id"]): ActSpec {
  const act = ACTS.find((a) => a.id === id);
  if (!act) throw new Error(`Unknown act ${id}`);
  return act;
}

/** Scenes overlap by SCENE_TRANSITION_FRAMES at every slide + fade, and not at hard cuts. */
export function getActDuration(act: ActSpec): number {
  return act.scenes.reduce(
    (total, scene, i) => total + scene.durationInFrames - (i > 0 && scene.enter !== "cut" ? SCENE_TRANSITION_FRAMES : 0),
    0,
  );
}

export function getStoryDuration(showPainIntro: boolean): number {
  const acts = getActs(showPainIntro);
  return acts.reduce((total, act) => total + getActDuration(act), 0) - (acts.length - 1) * ACT_TRANSITION_FRAMES;
}
