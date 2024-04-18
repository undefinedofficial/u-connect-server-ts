/**
 * A writable stream of messages that is used in server-side handlers.
 */
export interface IServerStreamWriter<in T> {
    /**
     * Writes a message asynchronously. Only one write can be pending at a time.
     * <param name="message">The message to be written. Cannot be null.</param>
     */
    Write(message: T): Promise<void>;
}
//# sourceMappingURL=IServerStreamWriter.d.ts.map