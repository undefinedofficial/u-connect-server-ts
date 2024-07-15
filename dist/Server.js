"use strict";
/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UConnectServer = void 0;
const uWebSockets_js_1 = require("uWebSockets.js");
const models_1 = require("./models");
const enums_1 = require("./enums");
const errors_1 = require("./errors");
const Request_1 = require("./models/Request");
const Response_1 = require("./models/Response");
const Hub_1 = require("./Hub");
class UConnectServer {
    constructor({ ssl } = {}) {
        this.isRunning = false;
        this.isSSL = ssl ? true : false;
        this.app = ssl
            ? (0, uWebSockets_js_1.SSLApp)({ cert_file_name: ssl.cert, key_file_name: ssl.key, passphrase: ssl.passphrase })
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
                const SecWebSocketKey = req.getHeader("sec-websocket-key");
                const SecWebSocketProtocol = req.getHeader("sec-websocket-protocol");
                const SecWebSocketVersion = req.getHeader("sec-websocket-version");
                // const origin = req.getHeader("origin");
                // console.log("upgrade", origin, SecWebSocketProtocol);
                if (SecWebSocketProtocol !== "u-connect-web") {
                    res.writeStatus("423").end();
                    return;
                }
                let userData = {};
                if (onUpgrade) {
                    userData = onUpgrade(res, req);
                    if (userData === false) {
                        res.end();
                        return;
                    }
                }
                res.upgrade({
                    contexts: new Map(),
                    ...userData,
                }, SecWebSocketKey, SecWebSocketProtocol, SecWebSocketVersion, context);
            },
            open(ws) {
                ws.getUserData().islive = true;
            },
            async message(ws, message, isBinary) {
                if (!isBinary)
                    return ws.end(1005, "Message is not binary");
                const { contexts } = ws.getUserData();
                let request;
                try {
                    request = Request_1.Request.Deserialize(message);
                }
                catch (error) {
                    console.warn(error);
                    return ws.end(1007, "Invalid message");
                }
                try {
                    if (request.type === enums_1.DataType.ABORT) {
                        if (contexts.has(request.id)) {
                            await contexts.get(request.id).Cancel();
                            contexts.delete(request.id);
                        }
                        return;
                    }
                    const method = hub.GetMethod(request.method);
                    if (!method)
                        throw new errors_1.ResponseError(request.id, request.method, enums_1.Status.NOT_FOUND, "Service not found");
                    if (contexts.has(request.id)) {
                        if (request.type === enums_1.DataType.STREAM_CLIENT &&
                            (method.Type === models_1.MethodType.ClientStreaming ||
                                method.Type === models_1.MethodType.DuplexStreaming)) {
                            contexts.get(request.id).Receive(request);
                            return;
                        }
                        if (request.type === enums_1.DataType.STREAM_END) {
                            if (method.Type !== models_1.MethodType.ClientStreaming &&
                                method.Type !== models_1.MethodType.DuplexStreaming)
                                throw new errors_1.ResponseError(request.id, request.method, enums_1.Status.UNIMPLEMENTED, `Method ${request.method} is not input stream`);
                            contexts.get(request.id).Finish();
                            contexts.delete(request.id);
                            return;
                        }
                        throw new errors_1.ResponseError(request.id, request.method, enums_1.Status.ALREADY_EXISTS, `Request ${request.id} in processing`);
                    }
                    const context = new models_1.ServerCallContextSource(ws, request);
                    contexts.set(request.id, context);
                    await method.Invoke(request, context);
                    contexts.delete(request.id);
                }
                catch (error) {
                    contexts.delete(request.id);
                    const response = new Response_1.Response(request.id, request.method, enums_1.DataType.ABORT, null, enums_1.Status.INTERNAL, null, "Internal server error");
                    if (error instanceof errors_1.ResponseError) {
                        response.status = error.status;
                        response.error = error.message;
                        // unknown origin bug, fix after throws exception `connection closed` in this line.
                        if (ws.getUserData().islive)
                            ws.send(Response_1.Response.Serialize(response), true);
                        console.error(error);
                    }
                    else {
                        // unknown origin bug, fix after throws exception `connection closed` in this line.
                        if (ws.getUserData().islive)
                            ws.send(Response_1.Response.Serialize(response), true);
                        throw error;
                    }
                }
            },
            async close(ws, code, message) {
                console.log("Connection close", code, Buffer.from(message).toString("ascii"));
                const userData = ws.getUserData();
                userData.islive = false;
                for (const context of userData.contexts.values())
                    await context.Cancel();
                userData.contexts.clear();
                onClose === null || onClose === void 0 ? void 0 : onClose(ws, code, Buffer.from(message).toString("ascii"));
            },
        });
        return hub;
    }
    Run({ host = "0.0.0.0", port = 3000 } = {}) {
        this.app.listen(host, port, (listenSocket) => {
            const protocol = this.isSSL ? "wss" : "ws";
            if (listenSocket)
                console.log(`Listening on ${protocol}://${host}:${port}`);
            else
                console.log(`Failed to listen on ${protocol}://${host}:${port}`);
            this.isRunning = true;
        });
    }
}
exports.UConnectServer = UConnectServer;
