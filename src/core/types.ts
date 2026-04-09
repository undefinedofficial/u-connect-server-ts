import { Dispatcher } from "./Dispatcher";
import { ServerCallContext } from "./ServerCallContext";

export const RPC_METADATA = Symbol("rpc:metadata");

/**  Method types supported by u-connect. */
export const enum MethodType {
  /** Single request sent from client, single response received from server. */
  Unary,

  /** Stream of request sent from client, single response received from server. */
  ClientStreaming,

  /** Single request sent from client, stream of responses received from server. */
  ServerStreaming,

  /** Both server and client can stream arbitrary number of requests and responses simultaneously. */
  DuplexStreaming,
}

export type MiddlewareFn = (
  ctx: ServerCallContext,
  next: () => Promise<void>
) => Promise<any> | any;

export type TransformerFn<TInput = unknown, TOutput = any> = (
  data: TInput
) => Promise<TOutput> | TOutput;

export type MethodMetadata = {
  type?: MethodType;
  name?: string;
  middlewares?: MiddlewareFn[];
  transformer?: TransformerFn;
};

export interface ServiceMetadata {
  methods: Map<string | symbol, MethodMetadata>;
  middlewares?: MiddlewareFn[];
}

/**
 * A writable stream of messages that is used in server-side handlers.
 */
export interface IServerStreamWriter<T> {
  /**
   * Writes a message asynchronously. Only one write can be pending at a time.
   * @param message The message to be written. Cannot be null.
   */
  Write(message: T): Promise<boolean>;
}

/**
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

  [Symbol.asyncIterator](): AsyncIterator<T>;
}

export type PackageID = string | number;

export const enum PackageType {
  /**
   * Unary request sent from client, single response received from server.
   */
  UNARY_CLIENT = MethodType.Unary,

  /**
   * Request sent from client for creating a stream or sending data in stream.
   */
  STREAM_CLIENT = MethodType.ClientStreaming,

  /**
   * Response received from server for creating a stream or receiving data in stream.
   */
  STREAM_SERVER = MethodType.ServerStreaming,

  /**
   * Request sent to the server for creating a full duplex stream.
   */
  STREAM_DUPLEX = MethodType.DuplexStreaming,

  /**
   * Notifies Stream data end of sent from client or server.
   */
  STREAM_END,

  /**
   * Abort any pending request or stream.
   */
  ABORT,
}

type Metadata = Record<string, string>;

export type RequestMetadata = Readonly<Metadata>;
export type ResponseMetadata = Metadata;

export const enum Status {
  /**
   * The operation completed successfully.
   */
  OK,
  /**
   * The operation was cancelled, typically by the caller.
   */
  CANCELLED,
  /**
   * Unknown error.  An example of where this error may be returned is
   * if a Status value received from another address space belongs to
   * an error-space that is not known in this address space.  Also
   * errors raised by APIs that do not return enough error information
   * may be converted to this error.
   */
  UNKNOWN,
  /**
   * Client specified an invalid argument.  Note that this differs
   * from INVALID_ARGUMENT and OUT_OF_RANGE in that it indicates
   * arguments that are problematic regardless of the state of the
   * system (e.g., a malformed file name).
   */
  INVALID_ARGUMENT,
  /**
   * Deadline expired before operation could complete.  For operations
   * that change the state of the system, this error may be returned
   * even if the operation has completed successfully.  For example, a
   * successful response from a server could have been delayed longer
   * than the deadline.
   */
  DEADLINE_EXCEEDED,
  /**
   * Some requested entity (e.g., file or directory) was not found.
   * For some entities, the error may indicate that the entity
   * does not exist or has been removed, or it may indicate that the
   * entity is not visible to the requesting user.
   */
  NOT_FOUND,
  /**
   * Some entity that we attempted to create (e.g., file or directory)
   * already exists.
   */
  ALREADY_EXISTS,
  /**
   * The caller does not have permission to execute the specified
   * operation.  PERMISSION_DENIED must not be used for rejections
   * caused by exhausting some resource (use RESOURCE_EXHAUSTED instead).
   */
  PERMISSION_DENIED,

  /**
   * Some resource has been exhausted, perhaps the entire file system is out of space.
   */
  RESOURCE_EXHAUSTED,

  /**
   * Operation was rejected because the system is not in a state
   * required for the operation's execution.  For example, directory
   * to be deleted may be non-empty, an rmdir operation is applied to
   * a non-directory, etc.
   *
   * A litmus test that may help a service implementor in deciding
   * between FAILED_PRECONDITION, ABORTED, and UNAVAILABLE:
   *  (a) Use UNAVAILABLE if the client can retry just the failing call.
   *  (b) Use ABORTED if the client should retry at a higher-level
   *      (e.g., restarting a read-modify-write sequence).
   *  (c) Use FAILED_PRECONDITION if the client should not retry
   *      until the system state has been explicitly fixed.
   *  (d) Use FAILED_PRECONDITION if the client performs conditional
   */
  FAILED_PRECONDITION,

  /**
   * The operation was aborted, typically due to a concurrency issue
   * such as a sequencer check failure or transaction abort.
   * See the guidelines above for deciding between FAILED_PRECONDITION,
   * ABORTED, and UNAVAILABLE.
   * ABORTED must not be used if the client can retry.
   */
  ABORTED,

  /**
   * Operation was attempted past the valid range.  E.g., seeking or
   * reading past end-of-file.
   * Unlike INVALID_ARGUMENT, this error indicates a problem that may
   * be fixed if the system state changes. For example, a 32-bit file
   * system will generate INVALID_ARGUMENT if asked to read at an
   * offset that is not in the range [0,2^32-1], but it will generate
   * OUT_OF_RANGE if asked to read from an offset past the current
   * file size.
   */
  OUT_OF_RANGE,

  /**
   * Operation is not implemented or not supported/enabled in this service.
   */
  UNIMPLEMENTED,

  /**
   * Internal errors.  Means some invariants expected by underlying
   * system has been broken.  If you see this error,
   * something is very broken.
   */
  INTERNAL,

  /**
   * The service is currently unavailable.  This is a most likely a
   * transient condition and may be corrected by retrying with
   * a backoff.
   *
   * See the guidelines above for deciding between FAILED_PRECONDITION,
   * ABORTED, and UNAVAILABLE.
   */
  UNAVAILABLE,

  /**
   * The operation was attempted past the valid range.  E.g., seeking or
   * reading past end-of-file.
   * Unlike INVALID_ARGUMENT, this error indicates a problem that may
   * be fixed if the system state changes. For example, a 32-bit file
   * system will generate INVALID_ARGUMENT if asked to read at an
   * offset that is not in the range [0,2^32-1], but it will generate
   * OUT_OF_RANGE if asked to read from an offset past the current
   * file size.
   */
  DATA_LOSS,

  /**
   * The request does not have valid authentication credentials for the
   * operation.
   * UNAUTHENTICATED must not be used for rejections caused by an
   * unauthenticated client.
   * This error indicates that the client must first authenticate
   * with the server.
   */
  UNAUTHENTICATED,
}

export interface ISerializer<IS_BINARY extends boolean = true> {
  binary: IS_BINARY;
  serialize<T>(
    data: [
      id: PackageID,
      fullMethod: string,
      type: PackageType,
      payload: T,
      status?: Status,
      meta?: RequestMetadata | null,
      error?: string
    ]
  ): IS_BINARY extends true ? ArrayBuffer | Uint8Array : string;
  deserialize<T>(
    data: IS_BINARY extends true ? Uint8Array : string
  ): [PackageID, string, PackageType, T, RequestMetadata];
}

export interface ITransport {
  bindDispatcher(dispatcher: Dispatcher): void;
  listen(port: number): Promise<void>;
}

export interface IConnection<T = any> {
  id: string;
  getData(): T;
  send(
    data: string | ArrayBuffer | Uint8Array,
    binary: boolean,
    compress?: boolean
  ): Promise<boolean>;
  close(code?: number, message?: string): void;
}
