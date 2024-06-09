/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
import { Status } from "../enums";
import { IClientStreamReader, IServerStreamWriter, IWebSocket, RequestMetadata, ResponseMetadata } from "../interfaces";
import { CancellationToken, CancellationTokenSource } from "./CancellationToken";
import { Request } from "./Request";
import { Response } from "./Response";
export declare abstract class ServerCallContext {
    constructor(id: number, method: string, cancellationTokenSource: CancellationTokenSource, requestMeta?: RequestMetadata | null, deadline?: number);
    abstract GetUserState<T>(): T;
    /**
     * Unique for the socket identifier of this task.
     */
    readonly Id: number;
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
    CancellationToken: CancellationToken;
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
    abstract Kill(): Promise<void>;
}
export declare class ClientStreamReader<T> implements IClientStreamReader<T> {
    private readonly _context;
    private _buffer;
    private _current;
    private _finished;
    private _resolve;
    constructor(_context: ServerCallContextSource);
    private Continue;
    get Current(): T;
    MoveNext(): Promise<boolean>;
    /**
     * Accept message and push to queue for processing.
     */
    Receive(message: T): void;
    Finish(): void;
}
export declare class ServerStreamWriter<T> implements IServerStreamWriter<T> {
    private readonly _context;
    constructor(_context: ServerCallContextSource);
    Write(message: T): Promise<void>;
}
export declare class ServerCallContextSource extends ServerCallContext {
    private isCancellationRequested;
    /**
     * Creates a new instance of ServerCallContext on every request for controlling current call.
     *
     * @param {IWebSocket} webSocket - The web socket object.
     * @param {IRequest<any>} request - The request object.
     * @param {number} [deadline] - The deadline for the operation (optional).
     */
    constructor(webSocket: IWebSocket, request: Request<any>, deadline?: number);
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
    _clientStreamCore?: ClientStreamReader<any>;
    /**
     * Receives a request and forwards it to the client stream if it exists.
     * @param {IRequest<T>} request - The request to be received.
     */
    Receive<T>(request: Request<T>): void;
    Finish(): void;
    /**
     * Creates a new instance of ClientStreamReader and returns it.
     *
     * @template T - The type of data that will be read from the client stream.
     * @returns {IClientStreamReader<T>} - The newly created client stream reader.
     */
    CreateClientStreamReader<T>(): IClientStreamReader<T>;
    /**
     * Creates a new instance of ServerStreamWriter and returns it.
     *
     * @template T - The type of data that will be written by the server stream writer.
     * @returns {IServerStreamWriter<T>} - The newly created server stream writer.
     */
    CreateServerStreamWriter<T>(): IServerStreamWriter<T>;
    /**
     * CancellationTokenSource for controlling current call cancellation.
     */
    private _cancellationTokenCore;
    /**
     * The web socket connection.
     */
    private _webSocketCore;
    /**
     * Kills all active tasks and close the connection.
     *
     * @return {Promise<void>} A promise that resolves when the process is killed.
     */
    Kill(): Promise<void>;
    /**
     * Sends the response based on the provided input.
     * @param {IResponse<T>} response - The response to be sent.
     * @return {Promise<void>} A promise that resolves when the response is sent.
     */
    Send<T>(response: Response<T>): Promise<void>;
    static Send<T>(response: Response<T>, webSocket: IWebSocket): Promise<void>;
}
//# sourceMappingURL=ServerCallContext.d.ts.map