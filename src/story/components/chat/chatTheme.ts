import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CLIENT } from "../../../theme/client";
import { STORY_SPRING } from "../../../theme/motion";

/**
 * Chat UI colours sampled from flat/11-wa-confirmation.png. Sizes in the chat
 * components are phone screen points (393-wide), since they always render
 * inside a PhoneFrame.
 */
export const CHAT = {
  background: "#F2EEE6",
  bar: "#FAF7F2",
  divider: "#E6DED1",
  dateChip: "#E6DED1",
  dateChipText: "#6B6259",
  incoming: CLIENT.white,
  outgoing: CLIENT.ink,
  meta: "#9C938B",
  online: "#2E9B5A",
  textSize: 16,
  radius: 18,
  sideMargin: 14,
} as const;

/**
 * Shared entrance for anything that arrives in the thread. Before
 * `startFrame - typingFrames` nothing shows; then a typing indicator holds
 * the slot for `typingFrames`; then the item springs in.
 */
export function useChatEntrance(startFrame: number, typingFrames = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const typingStart = startFrame - typingFrames;
  const typing = typingFrames > 0 && frame >= typingStart && frame < startFrame;
  const typingIn = interpolate(frame, [typingStart, typingStart + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const enter = spring({ frame: frame - startFrame, fps, config: STORY_SPRING });

  return { typing, typingIn, enter, visible: frame >= startFrame };
}
