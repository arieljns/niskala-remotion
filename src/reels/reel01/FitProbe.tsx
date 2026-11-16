import type { CalculateMetadataFunction } from "remotion";
import type { ReelSpec } from "../contract/spec.schema";
import type { FitEntry } from "../contract/fit-types";
import type { ReelTiming } from "../contract/timing-types";
import { computeFit } from "./fit";

export type FitProbeProps = { spec: ReelSpec; timing: ReelTiming; fit: FitEntry[] };

/** Renders nothing. The point is calculateMetadata, which measures the copy in a real browser with the real fonts. */
export const FitProbe: React.FC<FitProbeProps> = () => null;

export const calculateFitMetadata: CalculateMetadataFunction<FitProbeProps> = async ({ props }) => ({
  props: { ...props, fit: await computeFit(props.spec, props.timing) },
});
