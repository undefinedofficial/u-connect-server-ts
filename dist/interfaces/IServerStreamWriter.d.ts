/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
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
//# sourceMappingURL=IServerStreamWriter.d.ts.map