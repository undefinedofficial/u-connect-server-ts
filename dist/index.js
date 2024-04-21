"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUConnect = exports.ServerCallContext = void 0;
const uWebSockets_js_1 = require("uWebSockets.js");
const models_1 = require("./models");
const ResponseError_1 = require("./errors/ResponseError");
__exportStar(require("./decorators"), exports);
var models_2 = require("./models");
Object.defineProperty(exports, "ServerCallContext", { enumerable: true, get: function () { return models_2.ServerCallContext; } });
function createUConnect({ host = "0.0.0.0", port = 3000, path = "/api/u-connect", sendPingsAutomatically = true, compression = false, idleTimeout, maxBackpressure, maxLifetime, maxPayloadLength, onUpgrade, onClose, ssl, } = {}) {
    const methods = new Map();
    const app = ssl
        ? (0, uWebSockets_js_1.SSLApp)({ cert_file_name: ssl.cert, key_file_name: ssl.key, passphrase: ssl.passphrase })
        : (0, uWebSockets_js_1.App)();
    app.ws(path, {
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
            const origin = req.getHeader("origin");
            const SecWebSocketKey = req.getHeader("sec-websocket-key");
            const SecWebSocketProtocol = req.getHeader("sec-websocket-protocol");
            const SecWebSocketVersion = req.getHeader("sec-websocket-version");
            console.log("upgrade", origin, SecWebSocketProtocol);
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
            var _a;
            try {
                if (!isBinary)
                    throw new ResponseError_1.ResponseError(0, "", 3 /* Status.INVALID_ARGUMENT */, "Not binary");
                const request = models_1.ServerCallContextSource.transporter.deserialize(message);
                if (!methods.has(request.method)) {
                    ws.send(models_1.ServerCallContextSource.transporter.serialize({
                        id: request.id,
                        type: request.type,
                        method: request.method,
                        status: 5 /* Status.NOT_FOUND */,
                        error: "Service not found",
                    }), true);
                    return;
                }
                const { contexts } = ws.getUserData();
                switch (request.type) {
                    case 9 /* DataType.ABORT */: {
                        if (contexts.has(request.id)) {
                            await contexts.get(request.id).Cancel();
                            contexts.delete(request.id);
                        }
                        break;
                    }
                    case 3 /* DataType.UNARY_CLIENT */: {
                        if (contexts.has(request.id))
                            break;
                        const method = methods.get(request.method);
                        if (method.Type !== 0 /* MethodType.Unary */)
                            throw new ResponseError_1.ResponseError(request.id, request.method, 12 /* Status.UNIMPLEMENTED */, `Method ${request.method} is not unary`);
                        const context = new models_1.ServerCallContextSource(ws, request);
                        contexts.set(request.id, context);
                        await method.Invoke(request, context);
                        break;
                    }
                    case 5 /* DataType.STREAM_CLIENT */: {
                        const method = methods.get(request.method);
                        if (method.Type !== 1 /* MethodType.ClientStreaming */ &&
                            method.Type !== 3 /* MethodType.DuplexStreaming */) {
                            throw new ResponseError_1.ResponseError(request.id, request.method, 12 /* Status.UNIMPLEMENTED */, `Method ${request.method} is not input streaming`);
                        }
                        if (!contexts.has(request.id) && method.Type === 1 /* MethodType.ClientStreaming */) {
                            const context = new models_1.ServerCallContextSource(ws, request);
                            contexts.set(request.id, context);
                            await method.Invoke(request, context);
                            contexts.delete(request.id);
                        }
                        else {
                            contexts.get(request.id).Receive(request);
                        }
                        break;
                    }
                    case 6 /* DataType.STREAM_SERVER */:
                        {
                            if (contexts.has(request.id))
                                throw new ResponseError_1.ResponseError(request.id, request.method, 14 /* Status.UNAVAILABLE */, `Method ${request.method} is already streaming`);
                            const method = methods.get(request.method);
                            if (method.Type !== 2 /* MethodType.ServerStreaming */ &&
                                method.Type !== 3 /* MethodType.DuplexStreaming */)
                                throw new ResponseError_1.ResponseError(request.id, request.method, 12 /* Status.UNIMPLEMENTED */, `Method ${request.method} is not output streaming`);
                            const context = new models_1.ServerCallContextSource(ws, request);
                            contexts.set(request.id, context);
                            await method.Invoke(request, context);
                        }
                        break;
                    case 7 /* DataType.STREAM_DUPLEX */: {
                        if (contexts.has(request.id))
                            break;
                        const method = methods.get(request.method);
                        if (method.Type !== 3 /* MethodType.DuplexStreaming */)
                            throw new ResponseError_1.ResponseError(request.id, request.method, 12 /* Status.UNIMPLEMENTED */, `Method ${request.method} is not duplex streaming`);
                        const context = new models_1.ServerCallContextSource(ws, request);
                        contexts.set(request.id, context);
                        await method.Invoke(request, context);
                        contexts.delete(request.id);
                        break;
                    }
                    case 8 /* DataType.STREAM_END */: {
                        if (!contexts.has(request.id))
                            break;
                        const method = methods.get(request.method);
                        if (method.Type !== 1 /* MethodType.ClientStreaming */ &&
                            method.Type !== 3 /* MethodType.DuplexStreaming */)
                            throw new ResponseError_1.ResponseError(request.id, request.method, 12 /* Status.UNIMPLEMENTED */, `Method ${request.method} is not stream`);
                        (_a = contexts.get(request.id)._clientStreamCore) === null || _a === void 0 ? void 0 : _a.Finish();
                        contexts.delete(request.id);
                        break;
                    }
                    default:
                        throw new ResponseError_1.ResponseError(request.id, request.method, 12 /* Status.UNIMPLEMENTED */, "Not implemented");
                }
            }
            catch (error) {
                if (error instanceof ResponseError_1.ResponseError) {
                    ws.send(models_1.ServerCallContextSource.transporter.serialize({
                        id: error.id,
                        type: 9 /* DataType.ABORT */,
                        method: error.method,
                        status: error.status,
                        error: error.message,
                    }), true);
                }
                else {
                    ws.send(models_1.ServerCallContextSource.transporter.serialize({
                        id: 0,
                        type: 9 /* DataType.ABORT */,
                        method: "",
                        status: 13 /* Status.INTERNAL */,
                        error: "Internal server error",
                    }), true);
                    console.error("Internal Server Error", error);
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
    function Run() {
        app.listen(host, port, (listenSocket) => {
            if (listenSocket)
                console.log(`Listening on ws://${host}:${port}${path}`);
            else
                console.log(`Failed to listen on port ws://${host}:${port}${path}`);
        });
    }
    const services = new Map();
    function AddService(service, name) {
        if (methods.has(name || service.name))
            throw new Error(`Service ${name || service.name} already exists`);
        const localMethods = service.prototype.Methods;
        if (!localMethods)
            throw new Error(`Service ${name || service.name} has no Methods`);
        for (const [method, descriptor] of localMethods)
            methods.set(models_1.Method.FullName(name || service.name, method), descriptor);
        services.set(name || service.name, service);
    }
    function RemoveService(name) {
        if (!methods.has(name))
            throw new Error(`Service ${name} doesn't exist`);
        const service = services.get(name);
        const localMethods = service.prototype.Methods;
        if (!localMethods)
            throw new Error(`Service ${name} has no Methods`);
        for (const [method, _] of localMethods)
            methods.delete(models_1.Method.FullName(name, method));
        services.delete(name);
    }
    return {
        Run,
        AddService,
        RemoveService,
    };
}
exports.createUConnect = createUConnect;
