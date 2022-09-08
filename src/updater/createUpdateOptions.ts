import type { BaseFormatHandlers, Files, MergeWithOverwrite } from "./types";
import type { BuildInFormatHandlers } from "./formats";

// export interface UpdateOptions<FileNameWithOptions extends string> {
//   files: Files<FileNameWithOptions, BuildInFormatHandlers>;
// }
export type UpdateOptions<FileNameWithOptions extends string> = {
  files: Files<FileNameWithOptions, BuildInFormatHandlers>;
};

export interface UpdateOptionsWithFormats<
  FileNameWithOptions extends string,
  CustomFormatHandlers extends BaseFormatHandlers
> {
  files: Files<
    FileNameWithOptions,
    MergeWithOverwrite<BuildInFormatHandlers, CustomFormatHandlers>
  >;
  formats: CustomFormatHandlers;
}

export function createUpdateOptions<FileNameWithOptions extends string>(
  updateOptions: UpdateOptions<FileNameWithOptions>
): UpdateOptions<FileNameWithOptions>;
export function createUpdateOptions<
  FileNameWithOptions extends string,
  CustomFormatHandlers extends BaseFormatHandlers
>(
  updateOptions: UpdateOptionsWithFormats<
    FileNameWithOptions,
    CustomFormatHandlers
  >
): UpdateOptionsWithFormats<FileNameWithOptions, CustomFormatHandlers>;
export function createUpdateOptions(updateOptions: unknown) {
  return updateOptions;
}
