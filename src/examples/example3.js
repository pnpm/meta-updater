import { createUpdateOptions } from "..";
import { eslintrc, tsconfig } from "./defaultFiles";

/**
 * Usage Example 1: Simple usage
 */
export default (_workspaceDir) => {
  return createUpdateOptions({
    files: {
      "tsconfig.json": (prev, _dir, _manifest) => prev ??tsconfig,
      ".eslintrc [json]": (prev) => prev ?? eslintrc,
    },
  });
};
