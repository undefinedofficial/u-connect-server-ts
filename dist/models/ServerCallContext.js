/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
import { DataType, Status } from "../enums";
import { CancellationTokenSource } from "./CancellationToken";
import { Response } from "./Response";
export class ServerCallContext {
    constructor(id, method, cancellationTokenSource, requestMeta, deadline) {
        this.Id = id;
        this.Method = method;
        this.Deadline = deadline;
        this.RequestMeta = requestMeta;
        this.CancellationToken = cancellationTokenSource.Token;
        this.Status = Status.OK;
    }
    /**
     * Unique for the socket identifier of this task.
     */
    Id;
    /**
     * Full name of method called in this task.
     */
    Method;
    /**
     * Deadline for this task. The call will be automatically cancelled once the deadline is exceeded.
     * @deprecated not implemented
     */
    Deadline;
    /**
     * Initial metadata sent by client.
     */
    RequestMeta;
    /**
     * Cancellation token signals when call is cancelled. It is also triggered when the deadline is exceeded or there was some other error (e.g. network problem).
     */
    CancellationToken;
    /**
     * Trailers to send back to client after finishes.
     */
    ResponseMeta;
    /**
     * Status to send back to client after finishes.
     */
    Status;
}
export class ClientStreamReader {
    _context;
    _buffer = [];
    _current;
    _finished = false;
    _resolve;
    constructor(_context) {
        this._context = _context;
    }
    Continue() {
        /**
         * Send message to client continue stream.
         */
        this._context.Send({
            id: this._context.Id,
            method: this._context.Method,
            type: DataType.STREAM_CLIENT,
        });
    }
    get Current() {
        return this._current;
    }
    MoveNext() {
        return new Promise((resolve) => {
            const next = () => {
                if (this._finished)
                    return resolve(false);
                if (this._buffer.length > 0) {
                    this._current = this._buffer.shift();
                    return resolve(true);
                }
                this.Continue();
            };
            this._resolve = next;
            next();
        });
    }
    /**
     * Accept message and push to queue for processing.
     */
    Receive(message) {
        this._buffer.push(message);
        this._resolve?.();
    }
    Finish() {
        this._finished = true;
        this._resolve?.();
    }
}
export class ServerStreamWriter {
    _context;
    constructor(_context) {
        this._context = _context;
    }
    Write(message) {
        return this._context.Send({
            id: this._context.Id,
            method: this._context.Method,
            type: DataType.STREAM_SERVER,
            response: message,
        });
    }
}
export class ServerCallContextSource extends ServerCallContext {
    isCancellationRequested = false;
    /**
     * Creates a new instance of ServerCallContext on every request for controlling current call.
     *
     * @param {IWebSocket} webSocket - The web socket object.
     * @param {IRequest<any>} request - The request object.
     * @param {number} [deadline] - The deadline for the operation (optional).
     */
    constructor(webSocket, request, deadline) {
        const cancellationTokenSource = new CancellationTokenSource(deadline);
        super(request.id, request.method, cancellationTokenSource, request.meta, deadline);
        this._cancellationTokenCore = cancellationTokenSource;
        this._webSocketCore = webSocket;
    }
    GetUserState() {
        return this._webSocketCore.getUserData();
    }
    /**
     * Returns the current instance of ServerCallContext.
     *
     * @return {ServerCallContext} The current instance of ServerCallContext.
     */
    get ServerCallContext() {
        return this;
    }
    /**
     * Cancels the asynchronous operation.
     *
     * @return {Promise<void>} A promise that resolves when the cancellation is complete.
     */
    async Cancel() {
        if (this._cancellationTokenCore.IsCancellationRequested)
            return;
        this._clientStreamCore?.Finish();
        return this._cancellationTokenCore.Cancel();
    }
    _clientStreamCore;
    /**
     * Receives a request and forwards it to the client stream if it exists.
     * @param {IRequest<T>} request - The request to be received.
     */
    Receive(request) {
        this._clientStreamCore?.Receive(request.request);
    }
    Finish() {
        this._clientStreamCore?.Finish();
    }
    /**
     * Creates a new instance of ClientStreamReader and returns it.
     *
     * @template T - The type of data that will be read from the client stream.
     * @returns {IClientStreamReader<T>} - The newly created client stream reader.
     */
    CreateClientStreamReader() {
        if (!this._clientStreamCore)
            this._clientStreamCore = new ClientStreamReader(this);
        return this._clientStreamCore;
    }
    /**
     * Creates a new instance of ServerStreamWriter and returns it.
     *
     * @template T - The type of data that will be written by the server stream writer.
     * @returns {IServerStreamWriter<T>} - The newly created server stream writer.
     */
    CreateServerStreamWriter() {
        return new ServerStreamWriter(this);
    }
    /**
     * CancellationTokenSource for controlling current call cancellation.
     */
    _cancellationTokenCore = new CancellationTokenSource();
    /**
     * The web socket connection.
     */
    _webSocketCore;
    /**
     * Kills all active tasks and close the connection.
     *
     * @return {Promise<void>} A promise that resolves when the process is killed.
     */
    Kill() {
        return new Promise((resolve, reject) => {
            if (this._webSocketCore.getUserData().islive == false)
                return reject("Connection is not live");
            this._webSocketCore.close();
            resolve();
        });
    }
    /**
     * Sends the response based on the provided input.
     * @param {IResponse<T>} response - The response to be sent.
     * @return {Promise<void>} A promise that resolves when the response is sent.
     */
    Send(response) {
        if (this._cancellationTokenCore.IsCancellationRequested) {
            console.log(`Cancelling call ${response.method} with id ${response.id}`);
            return Promise.resolve();
        }
        return ServerCallContextSource.Send(response, this._webSocketCore);
    }
    static Send(response, webSocket) {
        return new Promise((resolve, reject) => {
            if (webSocket.getUserData().islive == false)
                return reject("Connection is not live");
            webSocket.send(Response.Serialize(response), true);
            resolve();
        });
    }
}
