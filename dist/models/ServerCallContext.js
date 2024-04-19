"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerCallContextSource = exports.ServerStreamWriter = exports.ClientStreamReader = exports.ServerCallContext = void 0;
const CancellationToken_1 = require("./CancellationToken");
const MessagePackTransporter_1 = require("../middleware/MessagePackTransporter");
class ServerCallContext {
    constructor(id, method, cancellationTokenSource, requestMeta, deadline) {
        this.Id = id;
        this.Method = method;
        this.Deadline = deadline;
        this.RequestMeta = requestMeta;
        this.CancellationToken = cancellationTokenSource.Token;
        this.Status = 0 /* Status.OK */;
    }
}
exports.ServerCallContext = ServerCallContext;
class ClientStreamReader {
    constructor(_context) {
        this._context = _context;
        this._buffer = [];
        this._finished = false;
    }
    Continue() {
        /**
         * Send message to client continue stream.
         */
        this._context.Send({
            id: this._context.Id,
            method: this._context.Method,
            type: 5 /* DataType.STREAM_CLIENT */,
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
        var _a;
        this._buffer.push(message);
        (_a = this._resolve) === null || _a === void 0 ? void 0 : _a.call(this);
    }
    Finish() {
        this._finished = true;
        this._resolve();
    }
}
exports.ClientStreamReader = ClientStreamReader;
class ServerStreamWriter {
    constructor(_context) {
        this._context = _context;
    }
    Write(message) {
        return this._context.Send({
            id: this._context.Id,
            method: this._context.Method,
            type: 6 /* DataType.STREAM_SERVER */,
            response: message,
        });
    }
}
exports.ServerStreamWriter = ServerStreamWriter;
class ServerCallContextSource extends ServerCallContext {
    /**
     * Creates a new instance of ServerCallContext on every request for controlling current call.
     *
     * @param {IWebSocket} webSocket - The web socket object.
     * @param {IRequest<any>} request - The request object.
     * @param {number} [deadline] - The deadline for the operation (optional).
     */
    constructor(webSocket, request, deadline) {
        const cancellationTokenSource = new CancellationToken_1.CancellationTokenSource(deadline);
        super(request.id, request.method, cancellationTokenSource, request.meta, deadline);
        /**
         * CancellationTokenSource for controlling current call cancellation.
         */
        this._cancellationTokenCore = new CancellationToken_1.CancellationTokenSource();
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
        var _a;
        (_a = this._clientStreamCore) === null || _a === void 0 ? void 0 : _a.Finish();
        return this._cancellationTokenCore.Cancel();
    }
    /**
     * Receives a request and forwards it to the client stream if it exists.
     * @param {IRequest<T>} request - The request to be received.
     */
    Receive(request) {
        var _a;
        (_a = this._clientStreamCore) === null || _a === void 0 ? void 0 : _a.Receive(request.request);
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
            webSocket.send(ServerCallContextSource.transporter.serialize(response), true);
            resolve();
        });
    }
}
exports.ServerCallContextSource = ServerCallContextSource;
ServerCallContextSource.transporter = MessagePackTransporter_1.MessagePackTransporter;
