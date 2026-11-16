/**
 * npm run reel:schema
 *
 * Writes src/reels/contract/spec.schema.json from the Zod contract, for
 * structured output on agents that support it. The Zod schema stays the
 * authority; the JSON drops refinements (word and accent counts), and
 * `reel:check` still enforces those.
 */
import { writeFileSync } from "node:fs";
import { z } from "zod";
import { REPO_ROOT } from "./lib/brief.ts";
import { ReelSpec } from "../src/reels/contract/spec.schema.ts";

const out = `${REPO_ROOT}/src/reels/contract/spec.schema.json`;
writeFileSync(out, JSON.stringify(z.toJSONSchema(ReelSpec), null, 2) + "\n");
console.log(`Ditulis: ${out}`);
