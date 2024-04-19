/**
 * A writable stream of messages that is used in server-side handlers.
 */
export interface IServerStreamWriter<T> {
  /**
   * Writes a message asynchronously. Only one write can be pending at a time.
   * @param message The message to be written. Cannot be null.
   */
  Write(message: T): Promise<void>;
}
