import type { SceneSpec } from "../timeline";
import { ACT0_SCENES } from "./Act0";
import { ACT1_SCENES } from "./Act1";
import { ACT2_SCENES } from "./Act2";
import { ACT3_SCENES } from "./Act3";
import { ACT4_SCENES } from "./Act4";
import { ACT5_SCENES } from "./Act5";

export type SceneComponent = React.FC<{ scene: SceneSpec }>;

/**
 * Scene id → built scene. Any id not listed here renders as a SceneSlate
 * placeholder. Filled in act by act during Stage 3.
 */
export const SCENE_COMPONENTS: Partial<Record<string, SceneComponent>> = {
  ...ACT0_SCENES,
  ...ACT1_SCENES,
  ...ACT2_SCENES,
  ...ACT3_SCENES,
  ...ACT4_SCENES,
  ...ACT5_SCENES,
};
