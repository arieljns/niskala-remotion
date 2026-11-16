/** Runs every check available so far on a spec: the Zod contract, then the copy lint. Same function for the CLI and the negative tests. */
import { ReelSpec } from "../../src/reels/contract/spec.schema.ts";
import { lintCopy, type SpecError } from "./copy-lint.ts";

export type { SpecError };

export function schemaErrors(input: unknown): { spec: ReelSpec | null; errors: SpecError[] } {
  const result = ReelSpec.safeParse(input);
  if (result.success) return { spec: result.data, errors: [] };
  return {
    spec: null,
    errors: result.error.issues.map((issue) => {
      const known = /^([A-Z_]+): (.*)$/.exec(issue.message);
      const code =
        known?.[1] ??
        (issue.code === "unrecognized_keys" || ("origin" in issue && issue.origin === "array")
          ? "PRESET_VIOLATION"
          : issue.path[0] === "contractVersion"
            ? "CONTRACT_MISMATCH"
            : issue.path.some((part) => part === "text") && /line breaks/.test(issue.message)
              ? "LINEBREAK_FORBIDDEN"
              : "SCHEMA_INVALID");
      return {
        code,
        path: issue.path.join("."),
        message: known?.[2] ?? issue.message,
        hint:
          code === "CONTRACT_MISMATCH"
            ? "Pakai contractVersion dari src/reels/contract/spec.schema.ts."
            : "Ikuti src/reels/contract/spec.schema.json.",
      };
    }),
  };
}

/** `allowedNumbers` null = exempt from the numbers check (Reel01 only). */
export function checkSpec(input: unknown, allowedNumbers: ReadonlySet<string> | null): SpecError[] {
  const { spec, errors } = schemaErrors(input);
  return spec ? lintCopy(spec, allowedNumbers) : errors;
}
