import type { Files } from './files'
import type { BaseFormatPlugins } from './formatPlugin.js'
import type { BuildInFormatPlugins } from './builtInFormats.js'

export function createUpdateOptions<FileNameWithOptions extends string>(
  files: UpdateOptionsLegacy<FileNameWithOptions>
): UpdateOptionsLegacy<FileNameWithOptions>
export function createUpdateOptions<FileNameWithOptions extends string>(
  updateOptions: UpdateOptions<FileNameWithOptions>
): UpdateOptions<FileNameWithOptions>
export function createUpdateOptions<
  FileNameWithOptions extends string,
  UserDefinedFormatPlugins extends BaseFormatPlugins
>(
  updateOptions: UpdateOptionsWithFormats<FileNameWithOptions, UserDefinedFormatPlugins>
): UpdateOptionsWithFormats<FileNameWithOptions, UserDefinedFormatPlugins>
export function createUpdateOptions(updateOptions: unknown) {
  return updateOptions
}

export type UpdateOptionsLegacy<FileNameWithOptions extends string> = Files<FileNameWithOptions, BuildInFormatPlugins>

export type UpdateOptions<FileNameWithOptions extends string> = {
  files: Files<FileNameWithOptions, BuildInFormatPlugins>
}

export interface UpdateOptionsWithFormats<
  FileNameWithOptions extends string,
  UserDefinedFormatPlugins extends BaseFormatPlugins
> {
  files: Files<FileNameWithOptions, MergeWithOverwrite<BuildInFormatPlugins, UserDefinedFormatPlugins>>
  formats: UserDefinedFormatPlugins
}

type Id<T> = { [K in keyof T]: T[K] } & {}
type MergeWithOverwrite<O1, O2> = Id<Omit<O1, keyof O2> & O2>
