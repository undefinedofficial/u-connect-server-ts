declare class CancellationToken {
    protected _isCancelled: boolean;
    protected _callbacks: Set<() => unknown | Promise<unknown>> | null;
    protected _promise: Promise<void> | null;
    protected _resolve: (() => void) | null;
    get IsCancellationRequested(): boolean;
    /**
     * Register a callback (If token is already cancelled - execute immediately)
     */
    Register(callback: () => unknown | Promise<unknown>): void;
    Unregister(callback: () => void): void;
    get CancellationPromise(): Promise<void>;
}
declare class CancellationTokenSource extends CancellationToken {
    get Token(): CancellationToken;
    Cancel(): Promise<void>;
}

declare class ClientStreamReader<T> implements IClientStreamReader<T> {
    private readonly _context;
    private readonly _transformer?;
    private readonly _bufferLimit;
    private readonly _buffer;
    private _current;
    private _finished;
    private _nextPromise;
    private _isSuspended;
    constructor(_context: ServerCallContextSource, _transformer?: TransformerFn | undefined, _bufferLimit?: number);
    get Current(): T;
    private setCurrent;
    private updateFlowControl;
    MoveNext(): Promise<boolean>;
    Receive(message: T): void;
    Finish(): void;
    [Symbol.asyncIterator](): AsyncIterator<T>;
}
declare class ServerStreamWriter<T> implements IServerStreamWriter<T> {
    private readonly _context;
    constructor(_context: ServerCallContextSource);
    Write(message: T): Promise<boolean>;
}

declare abstract class ServerCallContext {
    constructor(id: PackageID, method: string, requestMeta?: RequestMetadata | null, deadline?: number);
    abstract GetUserState<T>(): T;
    /**
     * Unique for the socket identifier of this task.
     */
    readonly Id: PackageID;
    /**
     * Full name of method called in this task.
     */
    readonly Method: string;
    /**
     * Deadline for this task. The call will be automatically cancelled once the deadline is exceeded.
     */
    readonly Deadline?: number;
    /**
     * Initial metadata sent by client.
     */
    readonly RequestMeta?: RequestMetadata | null;
    /**
     * Cancellation token signals when call is cancelled. It is also triggered when the deadline is exceeded or there was some other error (e.g. network problem).
     */
    abstract readonly CancellationToken: CancellationToken;
    /**
     * Trailers to send back to client after finishes.
     */
    ResponseMeta?: ResponseMetadata | null;
    /**
     * Status to send back to client after finishes.
     */
    Status: Status;
    /**
     *  Disconnect the current client from the service and sever all ties with him
     */
    abstract Kill(): void;
}
declare class ServerCallContextSource extends ServerCallContext {
    /**
     * Creates a new instance of ServerCallContext on every request for controlling current call.
     *
     * @param {IWebSocket} webSocket - The web socket object.
     * @param {IRequest<any>} request - The request object.
     * @param {number} [deadline] - The deadline for the operation (optional).
     */
    constructor(connection: IConnection, serializer: ISerializer, id: PackageID, method: string, meta: RequestMetadata);
    GetUserState<T>(): T;
    /**
     * Returns the current instance of ServerCallContext.
     *
     * @return {ServerCallContext} The current instance of ServerCallContext.
     */
    get ServerCallContext(): ServerCallContext;
    /**
     * Cancels the asynchronous operation.
     *
     * @return {Promise<void>} A promise that resolves when the cancellation is complete.
     */
    Cancel(): Promise<void>;
    private _clientStreamCore?;
    /**
     * Return instance of ClientStreamReader.
     * @template T - The type of data that will be read from the client stream.
     */
    getClientStreamReader<T>(): ClientStreamReader<T> | undefined;
    /**
     * Save instance of ClientStreamReader.
     *
     * @template T - The type of data that will be read from the client stream.
     */
    setClientStreamReader<T>(stream: ClientStreamReader<T>): void;
    private _htimeout?;
    /**
     * CancellationTokenSource for controlling current call cancellation.
     */
    private readonly _cancellationTokenCore;
    get CancellationToken(): CancellationToken;
    /**
     * The connection.
     */
    private readonly _connectionCore;
    private readonly _serializerCore;
    /**
     * Kills all active tasks and close the connection.
     *
     * @return {Promise<void>} A promise that resolves when the process is killed.
     */
    Kill(): void;
    /**
     * Sends the response based on the provided input.
     * @param {Response<T>} response - The response to be sent.
     * @return {Promise<boolean>} A promise that resolves to true if the response was sent successfully, or false if the operation was cancelled.
     */
    Send<T>(type: PackageType, payload?: T): Promise<boolean>;
    /**
     * Sends the response based on the provided input.
     * @param {Response<T>} response - The response to be sent.
     * @return {Promise<boolean>} A promise that resolves to true if the response was sent successfully, or false if the operation was cancelled.
     */
    SendEnd<T>(type: PackageType, payload?: T): Promise<boolean>;
    SendError(type: PackageType, error: string): Promise<boolean>;
    private RawSend;
}

interface IMethod {
    Type: MethodType;
    ServiceName: string;
    Name: string;
    FullName: string;
    Invoke(request: unknown, context: ServerCallContextSource): Promise<void>;
}

declare class MethodRegistry {
    private methods;
    get(fullName: string): IMethod | undefined;
    add(method: IMethod): void;
}

declare class Dispatcher {
    private readonly _registry;
    private readonly _serializer;
    private readonly _contexts;
    constructor(_registry: MethodRegistry, _serializer: ISerializer);
    dispatch(connection: IConnection, rawMessage: Uint8Array<ArrayBuffer>, isBinary: boolean): Promise<void>;
    close(connection: IConnection): Promise<void>;
    private sendError;
}

declare const RPC_METADATA: unique symbol;
/**  Method types supported by u-connect. */
declare const enum MethodType {
    /** Single request sent from client, single response received from server. */
    Unary = 0,
    /** Stream of request sent from client, single response received from server. */
    ClientStreaming = 1,
    /** Single request sent from client, stream of responses received from server. */
    ServerStreaming = 2,
    /** Both server and client can stream arbitrary number of requests and responses simultaneously. */
    DuplexStreaming = 3
}
type MiddlewareFn = (ctx: ServerCallContext, next: () => Promise<void>) => Promise<any> | any;
type TransformerFn<TInput = unknown, TOutput = any> = (data: TInput) => Promise<TOutput> | TOutput;
type MethodMetadata = {
    type?: MethodType;
    name?: string;
    middlewares?: MiddlewareFn[];
    transformer?: TransformerFn;
};
interface ServiceMetadata {
    name?: string;
    middlewares?: MiddlewareFn[];
    methods: Map<string | symbol, MethodMetadata>;
}
/**
 * A writable stream of messages that is used in server-side handlers.
 */
interface IServerStreamWriter<T> {
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
interface IClientStreamReader<T> {
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
type PackageID = string | number;
declare const enum PackageType {
    /**
     * Unary request sent from client, single response received from server.
     */
    UNARY_CLIENT = 0,
    /**
     * Request sent from client for creating a stream or sending data in stream.
     */
    STREAM_CLIENT = 1,
    /**
     * Response received from server for creating a stream or receiving data in stream.
     */
    STREAM_SERVER = 2,
    /**
     * Request sent to the server for creating a full duplex stream.
     */
    STREAM_DUPLEX = 3,
    /**
     * Notifies Stream data end of sent from client or server.
     */
    STREAM_END = 4,
    /**
     * Abort any pending request or stream.
     */
    ABORT = 5,
    /**
     * Suspends the stream, preventing any further data from being received.
     */
    STREAM_SUSPEND = 6,
    /**
     * Resumes the stream, allowing data to be received again.
     */
    STREAM_RESUME = 7
}
type Metadata = Record<string, string>;
type RequestMetadata = Readonly<Metadata>;
type ResponseMetadata = Metadata;
declare const enum Status {
    /**
     * The operation completed successfully.
     */
    OK = 0,
    /**
     * The operation was cancelled, typically by the caller.
     */
    CANCELLED = 1,
    /**
     * Unknown error.  An example of where this error may be returned is
     * if a Status value received from another address space belongs to
     * an error-space that is not known in this address space.  Also
     * errors raised by APIs that do not return enough error information
     * may be converted to this error.
     */
    UNKNOWN = 2,
    /**
     * Client specified an invalid argument.  Note that this differs
     * from INVALID_ARGUMENT and OUT_OF_RANGE in that it indicates
     * arguments that are problematic regardless of the state of the
     * system (e.g., a malformed file name).
     */
    INVALID_ARGUMENT = 3,
    /**
     * Deadline expired before operation could complete.  For operations
     * that change the state of the system, this error may be returned
     * even if the operation has completed successfully.  For example, a
     * successful response from a server could have been delayed longer
     * than the deadline.
     */
    DEADLINE_EXCEEDED = 4,
    /**
     * Some requested entity (e.g., file or directory) was not found.
     * For some entities, the error may indicate that the entity
     * does not exist or has been removed, or it may indicate that the
     * entity is not visible to the requesting user.
     */
    NOT_FOUND = 5,
    /**
     * Some entity that we attempted to create (e.g., file or directory)
     * already exists.
     */
    ALREADY_EXISTS = 6,
    /**
     * The caller does not have permission to execute the specified
     * operation.  PERMISSION_DENIED must not be used for rejections
     * caused by exhausting some resource (use RESOURCE_EXHAUSTED instead).
     */
    PERMISSION_DENIED = 7,
    /**
     * Some resource has been exhausted, perhaps the entire file system is out of space.
     */
    RESOURCE_EXHAUSTED = 8,
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
    FAILED_PRECONDITION = 9,
    /**
     * The operation was aborted, typically due to a concurrency issue
     * such as a sequencer check failure or transaction abort.
     * See the guidelines above for deciding between FAILED_PRECONDITION,
     * ABORTED, and UNAVAILABLE.
     * ABORTED must not be used if the client can retry.
     */
    ABORTED = 10,
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
    OUT_OF_RANGE = 11,
    /**
     * Operation is not implemented or not supported/enabled in this service.
     */
    UNIMPLEMENTED = 12,
    /**
     * Internal errors.  Means some invariants expected by underlying
     * system has been broken.  If you see this error,
     * something is very broken.
     */
    INTERNAL = 13,
    /**
     * The service is currently unavailable.  This is a most likely a
     * transient condition and may be corrected by retrying with
     * a backoff.
     *
     * See the guidelines above for deciding between FAILED_PRECONDITION,
     * ABORTED, and UNAVAILABLE.
     */
    UNAVAILABLE = 14,
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
    DATA_LOSS = 15,
    /**
     * The request does not have valid authentication credentials for the
     * operation.
     * UNAUTHENTICATED must not be used for rejections caused by an
     * unauthenticated client.
     * This error indicates that the client must first authenticate
     * with the server.
     */
    UNAUTHENTICATED = 16
}
interface ISerializer<IS_BINARY extends boolean = true> {
    binary: IS_BINARY;
    serialize<T>(data: [
        id: PackageID,
        fullMethod: string,
        type: PackageType,
        payload: T,
        status?: Status,
        meta?: RequestMetadata | null,
        error?: string
    ]): IS_BINARY extends true ? ArrayBuffer | Uint8Array : string;
    deserialize<T>(data: IS_BINARY extends true ? Uint8Array : string): [PackageID, string, PackageType, T, RequestMetadata];
}
interface ITransport {
    bindDispatcher(dispatcher: Dispatcher): void;
    listen(port: number): Promise<void>;
}
interface IConnection<T = any> {
    id: string;
    getData(): T;
    send(data: string | ArrayBuffer | Uint8Array, binary: boolean, compress?: boolean): Promise<boolean>;
    close(code?: number, message?: string): void;
}

export { CancellationToken as C, Dispatcher as D, RPC_METADATA as R, ServerCallContext as S, Status as e, CancellationTokenSource as f, ClientStreamReader as g, MethodType as j, PackageType as k, ServerCallContextSource as n, ServerStreamWriter as o };
export type { ITransport as I, MiddlewareFn as M, PackageID as P, TransformerFn as T, ISerializer as a, IClientStreamReader as b, IServerStreamWriter as c, ServiceMetadata as d, IConnection as h, MethodMetadata as i, RequestMetadata as l, ResponseMetadata as m };
