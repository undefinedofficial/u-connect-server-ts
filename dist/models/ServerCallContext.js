"use strict";
/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerCallContextSource = exports.ServerStreamWriter = exports.ClientStreamReader = exports.ServerCallContext = void 0;
const enums_1 = require("../enums");
const CancellationToken_1 = require("./CancellationToken");
const Response_1 = require("./Response");
class ServerCallContext {
    constructor(id, method, cancellationTokenSource, requestMeta, deadline) {
        this.Id = id;
        this.Method = method;
        this.Deadline = deadline;
        this.RequestMeta = requestMeta;
        this.CancellationToken = cancellationTokenSource.Token;
        this.Status = enums_1.Status.OK;
    }
}
exports.ServerCallContext = ServerCallContext;
class ClientStreamReader {
    constructor(_context) {
        this._context = _context;
        this._buffer = [];
        this._finished = false;
    }
    /**
     * Send message to client continue stream.
     */
    Continue() {
        return this._context.Send({
            id: this._context.Id,
            method: this._context.Method,
            type: enums_1.DataType.STREAM_CLIENT,
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
                return this.Continue();
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
        var _a;
        this._finished = true;
        (_a = this._resolve) === null || _a === void 0 ? void 0 : _a.call(this);
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
            type: enums_1.DataType.STREAM_SERVER,
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
    constructor(webSocket, request) {
        var _a, _b;
        let deadline;
        if ((_a = request.meta) === null || _a === void 0 ? void 0 : _a["timeout"]) {
            deadline = parseInt((_b = request.meta) === null || _b === void 0 ? void 0 : _b["timeout"]) || undefined;
        }
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
    Cancel() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this._cancellationTokenCore.IsCancellationRequested)
                return;
            (_a = this._clientStreamCore) === null || _a === void 0 ? void 0 : _a.Finish();
            return this._cancellationTokenCore.Cancel();
        });
    }
    /**
     * Receives a request and forwards it to the client stream if it exists.
     * @param {IRequest<T>} request - The request to be received.
     */
    Receive(request) {
        var _a;
        (_a = this._clientStreamCore) === null || _a === void 0 ? void 0 : _a.Receive(request.request);
    }
    Finish() {
        var _a;
        (_a = this._clientStreamCore) === null || _a === void 0 ? void 0 : _a.Finish();
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
     * @param {Response<T>} response - The response to be sent.
     * @return {Promise<boolean>} A promise that resolves to true if the response was sent successfully, or false if the operation was cancelled.
     */
    Send(response) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._cancellationTokenCore.IsCancellationRequested)
                return Promise.resolve(false);
            yield ServerCallContextSource.Send(response, this._webSocketCore);
            return true;
        });
    }
    static Send(response, webSocket) {
        if (webSocket.getUserData().islive == false)
            return Promise.reject("Connection is not live");
        webSocket.send(Response_1.Response.Serialize(response), true);
        return Promise.resolve();
    }
}
exports.ServerCallContextSource = ServerCallContextSource;
