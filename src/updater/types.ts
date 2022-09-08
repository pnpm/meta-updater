import { ProjectManifest } from "@pnpm/types";

export type Id<T> = { [K in keyof T]: T[K] } & {};
export type MergeWithOverwrite<O1, O2> = Id<Omit<O1, keyof O2> & O2>;

export interface BaseFormatHandlers {
  [format: string]: FormatHandler<string, unknown>;
}

export interface FormatHandler<
  Extension extends string,
  Content,
> {
  extension?: Extension;
  /**
   * Function is called only if file exists.
   * Returns `null` when read or parse error
   */
  read(
    filePath: string,
    dir: string,
    manifest: ProjectManifest
  ): PromiseOrValue<Content | null>
  /**
   * @param content is `null` only if file doesn't exist
   * @param userUpdateFn
   * @param dir
   * @param manifest
   */
  update(
    content: Content | null,
    userUpdateFn: UpdateFunc<Content>,
    dir: string,
    manifest: ProjectManifest
  ): PromiseOrValue<Content | null>;
  write(
    content: Content,
    filePath: string,
    dir: string,
    manifest: ProjectManifest
  ): PromiseOrValue<void>;
}

// export type FormatReadFunc<Content> = {
//   bivarianceHack(
//     filePath: string,
//     dir: string,
//     manifest: ProjectManifest
//   ): PromiseOrValue<Content | null>;
// }["bivarianceHack"];

// export type FormatUpdateFunc<Content> = {
//   bivarianceHack(
//     content: Content | null,
//     userUpdateFn: UpdateFunc<Content>,
//     dir: string,
//     manifest: ProjectManifest
//   ): PromiseOrValue<Content | null>;
// }["bivarianceHack"];

// export type UpdateFunc<T> = {
//   bivarianceHack(
//     content: T | null,
//     dir: string,
//     manifest: ProjectManifest
//   ): PromiseOrValue<T | null>;
// }["bivarianceHack"];

export type UpdateFunc<T> = (
  content: T | null,
  dir: string,
  manifest: ProjectManifest
) => PromiseOrValue<T | null>;

export type PromiseOrValue<T> = T | Promise<T>;

export type GetContent<T extends FormatHandler<string, unknown>> = NonNullable<
  Awaited<ReturnType<T["update"]>>
>;

export type GetFormatHandler<
  FormatHandlers extends BaseFormatHandlers,
  Extension extends string,
   T = FormatHandlers[keyof FormatHandlers]
> = Extract<Exclude<T, {extension?: undefined }>, { extension?: Extension }>;

// export type GetFormatHandler<
//   FormatHandlers extends BaseFormatHandlers,
//   Extension extends string,
//   T = FormatHandlers[keyof FormatHandlers]
// > = T extends { extension: Extension | undefined } ? T : never;

export type GetSupportedExtensions<
  FormatHandlers extends BaseFormatHandlers,
  T = FormatHandlers[keyof FormatHandlers]
> = T extends { extension?: undefined } ? never : T extends { extension?: infer Extension extends string } ? Extension : never;

// export type GetSupportedExtensions<
//   FormatHandlers extends BaseFormatHandlers,
// > = GetFormatHandler<FormatHandlers, string>['extension'];

type GetSupportedFormats<FormatHandlers extends BaseFormatHandlers> = string &
  keyof FormatHandlers;

type GetFormatHandlerByExtension<
  FormatHandlers extends BaseFormatHandlers,
  Extension extends string
> = FormatHandlers[keyof FormatHandlers] & { extension: Extension };

export type Files<
  FileNameWithOptions extends string,
  FormatHandlers extends BaseFormatHandlers,
  SupportedExtensions extends string = GetSupportedExtensions<FormatHandlers>,
  SupportedFormats extends GetSupportedFormats<FormatHandlers> = GetSupportedFormats<FormatHandlers>
> = {
  [T in FileNameWithOptions]: T extends `${string}[${infer Format extends SupportedFormats}]`
    ? UpdateFunc<GetContent<FormatHandlers[Format]>>
    : T extends `${infer FileName}${SupportedExtensions}`
    ? T extends `${FileName}${infer Extension}`
      ? UpdateFunc<GetContent<GetFormatHandler<FormatHandlers, Extension>>>
      : never
    : never;
};
