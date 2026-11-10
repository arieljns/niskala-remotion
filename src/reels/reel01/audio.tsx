import { Audio } from "@remotion/media";
import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { getStaticFiles, Sequence, staticFile, type CalculateMetadataFunction } from "remotion";
import { REEL } from "../tokens";
import type { Reel01Props } from "./Reel01";
import { buildTimeline, musicVolume, specsFor, VO_DIR, type ReelTimeline, type SceneId } from "./timeline";

const AUDIO_DIR = "reels/reel01/audio";
const AUDIO_EXTENSIONS = ["wav", "mp3", "m4a"] as const;
/** Further off than this from the brief's table, a file is probably the wrong take. */
const DURATION_WARN_SECONDS = 0.15;

const hasStaticFile = (path: string) => getStaticFiles().some((file) => file.name === path);

/** Where a delivered sound goes: public/reels/reel01/audio/<id>.<wav|mp3|m4a>. */
function findAudio(id: string): string | undefined {
  return AUDIO_EXTENSIONS.map((extension) => `${AUDIO_DIR}/${id}.${extension}`).find(hasStaticFile);
}

async function fileSeconds(path: string): Promise<number> {
  const input = new Input({ formats: ALL_FORMATS, source: new UrlSource(staticFile(path)) });
  try {
    return await input.computeDuration();
  } finally {
    input.dispose();
  }
}

/** Reads every VO file's real length; the reel's length and all its scene frames follow from that. */
export const calculateReel01Metadata: CalculateMetadataFunction<Reel01Props> = async ({ props }) => {
  const specs = specsFor(props.hookVariant);
  const entries = await Promise.all(
    specs
      .filter((item) => hasStaticFile(`${VO_DIR}/${item.file}`))
      .map(async (item) => {
        const measured = await fileSeconds(`${VO_DIR}/${item.file}`);
        if (Math.abs(measured - item.expectedSeconds) > DURATION_WARN_SECONDS) {
          console.warn(`[vo] ${item.file} is ${measured.toFixed(2)} s, expected about ${item.expectedSeconds} s`);
        }
        return [item.id, measured] as const;
      }),
  );
  const seconds: Partial<Record<SceneId, number>> = Object.fromEntries(entries);
  const timeline = buildTimeline(props.hookVariant, seconds);
  const missing = specs.filter((item) => seconds[item.id] === undefined).map((item) => item.file);
  if (missing.length > 0) {
    console.warn(`[vo] SILENT: using expected durations for ${missing.length} missing file(s): ${missing.join(", ")}`);
  }

  return { durationInFrames: timeline.totalFrames, fps: REEL.fps, props: { ...props, timeline } };
};

export const VoTrack: React.FC<{ timeline: ReelTimeline }> = ({ timeline }) => (
  <>
    {timeline.order.map((id) => {
      const scene = timeline.scenes[id];
      return scene.missing ? null : (
        <Sequence
          key={id}
          name={`VO ${id}`}
          from={scene.from + scene.voFrom}
          durationInFrames={scene.voFrames}
          layout="none"
        >
          <Audio src={staticFile(`${VO_DIR}/${scene.file}`)} />
        </Sequence>
      );
    })}
  </>
);

/** TODO_MUSIC: silent until the file exists. */
export const MusicTrack: React.FC<{ timeline: ReelTimeline }> = ({ timeline }) => {
  const music = findAudio("TODO_MUSIC");
  return music ? (
    <Audio
      src={staticFile(music)}
      loop
      loopVolumeCurveBehavior="extend"
      volume={(frame) => musicVolume(frame, timeline)}
    />
  ) : null;
};

export type SfxCue = { id: "TODO_SFX_PUNCH" | "TODO_SFX_POP" | "TODO_SFX_TAP"; frame: number };

/** One sound per cue, each silent until its file exists. `frame` is absolute. */
export const SfxTrack: React.FC<{ cues: readonly SfxCue[] }> = ({ cues }) => (
  <>
    {cues.map((cue) => {
      const sound = findAudio(cue.id);
      return sound ? (
        <Sequence key={`${cue.id}-${cue.frame}`} name={cue.id} from={cue.frame} layout="none">
          <Audio src={staticFile(sound)} />
        </Sequence>
      ) : null;
    })}
  </>
);
