import { createUpdateOptions } from "..";
import { eslintrc, tsconfig } from "./defaultFiles";

/**
 * Usage Example 1: Simple usage
 */
export const default_simple = (_workspaceDir: string) => {
  return createUpdateOptions({
    files: {
      "tsconfig.json": (prev, _dir, _manifest) => prev ??tsconfig,
      ".eslintrc [json]": (prev) => prev ?? eslintrc,
    },
  });
};
