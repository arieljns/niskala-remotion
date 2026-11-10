import { AbsoluteFill } from "remotion";
import { linearTiming, type TransitionPresentation, type TransitionPresentationComponentProps } from "@remotion/transitions";
import { EASE } from "../theme/motion";

type SlideFadeProps = { distance: number };

/**
 * The story's default transition: the incoming scene slides in a short way
 * from the right while fading up, the outgoing one drifts left while fading
 * out. `distance` is a fraction of the canvas width, so it reads the same in
 * both aspect ratios.
 */
const SlideFadePresentation: React.FC<TransitionPresentationComponentProps<SlideFadeProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const entering = presentationDirection === "entering";
  const offset = entering ? (1 - presentationProgress) * passedProps.distance : -presentationProgress * passedProps.distance;
  const opacity = entering ? presentationProgress : 1 - presentationProgress;

  return <AbsoluteFill style={{ opacity, transform: `translateX(${offset * 100}%)` }}>{children}</AbsoluteFill>;
};

export function slideFade(distance = 0.06): TransitionPresentation<SlideFadeProps> {
  return { component: SlideFadePresentation, props: { distance } };
}

export function easedTiming(durationInFrames: number) {
  return linearTiming({ durationInFrames, easing: EASE });
}
