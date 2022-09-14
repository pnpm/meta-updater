import { BaseFormatPlugins, FormatPlugin, Updater } from './formatPlugin.js'

type GetContent<T extends FormatPlugin<unknown>> = NonNullable<Awaited<ReturnType<T['update']>>>

type GetSupportedExtensions<FormatPlugins extends BaseFormatPlugins> = string & keyof FormatPlugins

export type Files<
  FileNameWithOptions extends string,
  FormatPlugins extends BaseFormatPlugins,
  SupportedExtensions extends GetSupportedExtensions<FormatPlugins> = GetSupportedExtensions<FormatPlugins>
> = {
  [T in FileNameWithOptions]: T extends `${string}[${infer ForcedExtension extends SupportedExtensions}]`
    ? Updater<GetContent<FormatPlugins[ForcedExtension]>>
    : T extends `${infer FileName}${SupportedExtensions}`
    ? T extends `${FileName}${infer Extension}`
      ? Updater<GetContent<FormatPlugins[Extension]>>
      : never
    : never
}
