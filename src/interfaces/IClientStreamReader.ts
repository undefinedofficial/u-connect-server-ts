/**
 * A stream of messages to be read.
 * Messages can be awaited <c>await reader.MoveNext()</c>, that returns <c>true</c>
 * if there is a message available and <c>false</c> if there are no more messages
 * (i.e. the stream has been closed).
 * <para>
 * On the client side, the last invocation of <c>MoveNext()</c> either returns <c>false</c>
 * if the call has finished successfully or throws <c>RpcException</c> if call finished
 * with an error. Once the call finishes, subsequent invocations of <c>MoveNext()</c> will
 * continue yielding the same result (returning <c>false</c> or throwing an exception).
 * </para>
 * <para>
 * On the server side, <c>MoveNext()</c> does not throw exceptions.
 * In case of a failure, the request stream will appear to be finished
 * (<c>MoveNext</c> will return <c>false</c>) and the <c>CancellationToken</c>
 * associated with the call will be cancelled to signal the failure.
 * </para>
 * <para>
 * <c>MoveNext()</c> operations can be cancelled via a cancellation token. Cancelling
 * an individual read operation has the same effect as cancelling the entire call
 * (which will also result in the read operation returning prematurely), but the per-read cancellation
 * tokens passed to MoveNext() only result in cancelling the call if the read operation haven't finished
 * yet.
 * </para>
 * <typeparam name="T">The message type.</typeparam>
 */
export interface IClientStreamReader<out T> {
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
