import type { FormatHandler } from "./types";

// export function createFormat<Extension extends string, T extends FormatHandler<Extension, unknown>>(
// export function createFormat<Extension extends string, Content, T extends FormatHandler<Extension, Content>>(
  export function createFormat<Content>(format: FormatHandler<never, Content>): typeof format;
  export function createFormat<Extension extends string, Content>(format: FormatHandler<Extension, Content>): typeof format;
export function createFormat<Extension extends string, Content>(
    format: FormatHandler<Extension , Content>
) {
  return format;
}
