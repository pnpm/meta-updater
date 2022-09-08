import * as fs from "fs/promises";
import { createFormat, createUpdateOptions } from "..";
import { eslintrc, tsconfig } from "./defaultFiles";

/**
 * Usage Example 2: With custom format '.gitignore' defined
 */
const gitignoreFormat = createFormat({
  async read(filePath) {
    return (await fs.readFile(filePath, "utf8")).split("\n");
  },
  update(content, userUpdateFn, dir, manifest) {
    return userUpdateFn(content, dir, manifest);
  },
  async write(content, filePath: string) {
    const unique = <T extends unknown[]>(array: T) =>
      Array.from(new Set<T[number]>(array)).sort();
    await fs.writeFile(filePath, unique(content).join("\n"), "utf8");
  },
});

export const default_withFormats = async (_workspaceDir: string) => {
  return createUpdateOptions({
    files: {
      // builtin
      "tsconfig.json": (prev, _dir, _manifest) => prev ?? tsconfig,
      ".eslintrc [json]": (prev) => prev ?? eslintrc,
      // custom
      ".prettierignore [.gitignore]": (prev) => prev ?? ["node_modules"],
      "by-extension.ignore": (prev, _dir, _manifest) => prev,
      "by-type.txt [ignore]": (prev, _dir, _manifest) => prev,
      // [format-type] takes precedence
      "by-type.ignore [json]": (prev, _dir, _manifest) => prev,
    },
    formats: {
      ".gitignore": gitignoreFormat,
      ignore: {
        ...gitignoreFormat,
        extension: ".ignore" as const,
      },
    },
  });
};
