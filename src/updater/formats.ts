import { ProjectManifest } from "@pnpm/types";
import loadJsonFile from "load-json-file";
import writeJsonFile from "write-json-file";
import { createFormat } from "./createFormat";
import { PromiseOrValue, UpdateFunc } from "./types";

const readJsonFile = async <T>(p: string) => {
  try {
    return await loadJsonFile<T>(p);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return null;
    }
    throw err;
  }
};

// export const builtInFormatHandlers = {
//   json: createFormat({
//     extension: ".json",
//     read(filePath: string) {
//       return readJsonFile(filePath);
//     },
//     update(
//       content: object | null,
//       userUpdateFn,
//       dir,
//       manifest,
//     ) {
//       return userUpdateFn(content, dir, manifest);
//     },
//     async write(content, filePath, _dir, _manifest) {
//       await writeJsonFile(filePath, content, { detectIndent: true });
//     },
//   }),
// };

export type T = { name: string; version: string };

export const builtInFormatHandlers = {
  json: createFormat({
    extension: ".json",
    read(filePath, _dir, _manifest) {
      return readJsonFile<object>(filePath);
    },
    update(content, userUpdateFn, dir, manifest) {
      return userUpdateFn(content, dir, manifest);
    },
    async write(content, filePath, _dir, _manifest) {
      await writeJsonFile(filePath, content, { detectIndent: true });
    },
  }),
};
export type BuildInFormatHandlers = typeof builtInFormatHandlers;
