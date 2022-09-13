import v8 from 'v8'

export const clone =
  // @ts-expect-error
  typeof structuredClone === 'function' ? structuredClone : <T>(value: T): T => v8.deserialize(v8.serialize(value))
