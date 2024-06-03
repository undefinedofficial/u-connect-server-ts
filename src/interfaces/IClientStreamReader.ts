/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */

﻿/**
 * A stream of messages to be read.
 * Messages can be awaited await reader.MoveNext(), that returns true
 * if there is a message available and false if there are no more messages
 * (i.e. the stream has been closed).
 *
 * On the client side, the last invocation of MoveNext() either returns false
 * if the call has finished successfully or throws RpcException if call finished
 * with an error. Once the call finishes, subsequent invocations of MoveNext() will
 * continue yielding the same result (returning false or throwing an exception).
 * On the server side, MoveNext() does not throw exceptions.
 * In case of a failure, the request stream will appear to be finished
 * (MoveNext will return false) and the CancellationToken
 * associated with the call will be cancelled to signal the failure.
 * MoveNext() operations can be cancelled via a cancellation token. Cancelling
 * an individual read operation has the same effect as cancelling the entire call
 * (which will also result in the read operation returning prematurely), but the per-read cancellation
 * tokens passed to MoveNext() only result in cancelling the call if the read operation haven't finished
 * yet.
 */
export interface IClientStreamReader<T> {
  /**
   * Gets the current element in the iteration.
   */
  Current: T;

  /**
   * Advances the reader to the next element in the sequence, returning the result asynchronously.
   * <returns>
   * Task containing the result of the operation: true if the reader was successfully advanced
   * to the next element; false if the reader has passed the end of the sequence.</returns>
   */
  MoveNext(): Promise<boolean>;
}
