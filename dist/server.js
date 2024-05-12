"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUConnect = void 0;
const uWebSockets_js_1 = require("uWebSockets.js");
const models_1 = require("./models");
const enums_1 = require("./enums");
const errors_1 = require("./errors");
const Request_1 = require("./models/Request");
const Response_1 = require("./models/Response");
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
                if (!methods.has(request.method))
                    throw new errors_1.ResponseError(request.id, request.method, enums_1.Status.NOT_FOUND, "Service not found");
                const method = methods.get(request.method);
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
                    ws.send(Response_1.Response.Serialize(response), true);
                }
                else {
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
    function Run() {
        app.listen(host, port, (listenSocket) => {
            const protocol = ssl ? "wss" : "ws";
            if (listenSocket)
                console.log(`Listening on ${protocol}://${host}:${port}${path}`);
            else
                console.log(`Failed to listen on ${protocol}://${host}:${port}${path}`);
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
