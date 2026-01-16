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
exports.UConnectServer = void 0;
const uWebSockets_js_1 = require("uWebSockets.js");
const enums_1 = require("./enums");
const errors_1 = require("./errors");
const Hub_1 = require("./Hub");
const utils_1 = require("./utils");
const models_1 = require("./models");
class UConnectServer {
    constructor({ ssl } = {}) {
        this.isRunning = false;
        this.isSSL = ssl ? true : false;
        this.app = ssl
            ? (0, uWebSockets_js_1.SSLApp)({
                cert_file_name: ssl.cert,
                key_file_name: ssl.key,
                passphrase: ssl.passphrase,
            })
            : (0, uWebSockets_js_1.App)();
    }
    /**
     * Creates a new hub endpoint. The hub is an instance for connecting to and interacting with it.
     */
    CreateHub({ path, sendPingsAutomatically = true, compression = false, idleTimeout, maxBackpressure, maxLifetime, maxPayloadLength, onUpgrade, onClose, }) {
        if (this.isRunning)
            throw new Error("Can't create hub when Server is already running");
        const hub = new Hub_1.UConnectHubSource();
        this.app.ws(path, {
            compression: compression ? uWebSockets_js_1.SHARED_COMPRESSOR : uWebSockets_js_1.DISABLED,
            idleTimeout,
            maxBackpressure,
            sendPingsAutomatically,
            maxPayloadLength,
            maxLifetime,
            /**
             * Upgrades the connection to WebSocket if the Origin header is present.
             */
            upgrade(res, req, context) {
                return __awaiter(this, void 0, void 0, function* () {
                    const SecWebSocketKey = req.getHeader("sec-websocket-key");
                    const SecWebSocketProtocol = req.getHeader("sec-websocket-protocol");
                    const SecWebSocketVersion = req.getHeader("sec-websocket-version");
                    // const origin = req.getHeader("origin");
                    // console.log("upgrade", origin, SecWebSocketProtocol);
                    if (SecWebSocketProtocol !== "u-connect-web") {
                        res.writeStatus("423").end();
                        return;
                    }
                    /* Keep track of abortions */
                    const upgradeAborted = { aborted: false };
                    /* User data storage for this connection */
                    let userData = {};
                    /* This immediately calls open handler, you must not use res after this call */
                    const upgrade = () => res.upgrade(Object.assign({ contexts: new models_1.ServerCallContextManager() }, userData), SecWebSocketKey, SecWebSocketProtocol, SecWebSocketVersion, context);
                    // default strategy.
                    if (!onUpgrade) {
                        upgrade();
                        return;
                    }
                    const upgradeResult = onUpgrade(res, req);
                    // sync strategy
                    if (!(0, utils_1.isPromice)(upgradeResult)) {
                        userData = upgradeResult;
                        if (userData === false) {
                            res.end();
                            return;
                        }
                        upgrade();
                        return;
                    }
                    // async strategy
                    res.onAborted(() => (upgradeAborted.aborted = true));
                    userData = yield upgradeResult;
                    /* Handle aborts */
                    if (upgradeAborted.aborted)
                        return;
                    /* Handle failures or aborts from onUpgrade */
                    if (userData === false) {
                        res.end();
                        return;
                    }
                    /* Cork any async response including upgrade */
                    res.cork(upgrade);
                });
            },
            open(ws) {
                const userData = ws.getUserData();
                userData.islive = true;
                userData.contexts.SetWebSocket(ws);
            },
            message(ws, message, isBinary) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!isBinary)
                        return ws.end(1005, "Message is not binary");
                    const { contexts } = ws.getUserData();
                    let request;
                    try {
                        request = models_1.Request.Deserialize(message);
                    }
                    catch (error) {
                        console.warn(error);
                        return ws.end(1007, "Invalid message");
                    }
                    try {
                        if (request.type === enums_1.DataType.ABORT)
                            return yield contexts.Abort(request.id);
                        const method = hub.GetMethod(request.method);
                        if (!method)
                            throw new errors_1.ResponseError(request.id, request.method, enums_1.Status.NOT_FOUND, "Service not found");
                        if (contexts.Has(request.id)) {
                            if (request.type === enums_1.DataType.STREAM_CLIENT &&
                                (method.Type === models_1.MethodType.ClientStreaming ||
                                    method.Type === models_1.MethodType.DuplexStreaming))
                                return contexts.Get(request.id).Receive(request);
                            if (request.type === enums_1.DataType.STREAM_END) {
                                if (method.Type !== models_1.MethodType.ClientStreaming &&
                                    method.Type !== models_1.MethodType.DuplexStreaming)
                                    throw new errors_1.ResponseError(request.id, request.method, enums_1.Status.UNIMPLEMENTED, `Method ${request.method} is not input stream`);
                                contexts.Get(request.id).Finish();
                                contexts.Delete(request.id);
                                return;
                            }
                            throw new errors_1.ResponseError(request.id, request.method, enums_1.Status.ALREADY_EXISTS, `Request ${request.id} in processing`);
                        }
                        yield method.Invoke(request, contexts.Create(request));
                        // method finished successfully then delete context.
                        contexts.Delete(request.id);
                    }
                    catch (error) {
                        const response = new models_1.Response(request.id, request.method, enums_1.DataType.ABORT, null, enums_1.Status.INTERNAL, null, "Internal server error");
                        let internalError = true;
                        if (error instanceof errors_1.ResponseError) {
                            response.status = error.status;
                            response.error = error.message;
                            internalError = false;
                        }
                        // unknown origin bug, fix after throws exception `connection closed` in this line.
                        if (ws.getUserData().islive)
                            ws.send(models_1.Response.Serialize(response), true);
                        // method finished with error then delete context.
                        contexts.Delete(request.id);
                        // internal error? throw it up to caller.
                        if (internalError)
                            throw error;
                    }
                });
            },
            close(ws, code, message) {
                return __awaiter(this, void 0, void 0, function* () {
                    const userData = ws.getUserData();
                    userData.islive = false;
                    userData.contexts.Close();
                    onClose === null || onClose === void 0 ? void 0 : onClose(ws, code, Buffer.from(message).toString("ascii"));
                });
            },
        });
        return hub;
    }
    /**
     * Starts the server.
     */
    Run({ host = "0.0.0.0", port = 3000 } = {}) {
        if (this.isRunning)
            return;
        this.app.listen(host, port, (listenSocket) => {
            const protocol = this.isSSL ? "wss" : "ws";
            if (listenSocket) {
                console.log(`Listening on ${protocol}://${host}:${port}`);
                this.isRunning = true;
            }
            else {
                console.log(`Failed to listen on ${protocol}://${host}:${port}`);
            }
        });
    }
}
exports.UConnectServer = UConnectServer;
