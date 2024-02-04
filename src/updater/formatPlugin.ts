import type { ProjectManifest } from '@pnpm/types'

export function createFormat<Content>(format: FormatPlugin<Content>) {
  return format
}

export interface BaseFormatPlugins {
  [extension: string]: FormatPlugin<unknown>
}

export interface FormatPlugin<Content> {
  /** Called only if file exists */
  read(options: FormatPluginFnOptions): PromiseOrValue<Content>

  /**
   * Used to clone the object returned by `read` before passing it to `update`.
   * Defaults to `structuredClone`[1] if available, otherwise `v8.deserialize(v8.serialize(obj))`.
   * [1]: https://developer.mozilla.org/en-US/docs/web/api/structuredclone
   */
  clone?(value: Content): Content

  /** `actual` is `null` when file doesn't exist */
  update(
    actual: Content | null,
    updater: Updater<Content>,
    options: FormatPluginFnOptions,
  ): PromiseOrValue<Content | null>

  /** Called only if check for equality is required (`actual != null` & `expected != null`) */
  equal(expected: Content, actual: Content, options: FormatPluginFnOptions): PromiseOrValue<boolean>

  /** Called only if write is required (`--test` isn't specified, `expected != null` and `expected` is not equal to `actual`) */
  write(expected: Content, options: FormatPluginFnOptions): PromiseOrValue<void>
}

export interface FormatPluginFnOptions {
  // checkOnly: boolean
  file: string
  dir: string
  manifest: ProjectManifest
  resolvedPath: string
  _writeProjectManifest(manifest: ProjectManifest): Promise<void>
}

export type PromiseOrValue<T> = T | Promise<T>

export type Updater<T> = (content: T | null, options: FormatPluginFnOptions) => PromiseOrValue<T | null>
