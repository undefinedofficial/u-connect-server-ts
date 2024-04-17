export function isPromice<T>(val: T | Promise<T>): val is Promise<T> {
  return val instanceof Promise;
}
