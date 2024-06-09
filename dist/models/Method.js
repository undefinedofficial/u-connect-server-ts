"use strict";
/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplexStreamingMethod = exports.ServerStreamingMethod = exports.ClientStreamingMethod = exports.UnaryMethod = exports.Method = exports.MethodType = void 0;
const enums_1 = require("../enums");
const MethodError_1 = require("../errors/MethodError");
/**  Method types supported by u-connect. */
var MethodType;
(function (MethodType) {
    /** Single request sent from client, single response received from server. */
    MethodType[MethodType["Unary"] = 0] = "Unary";
    /** Stream of request sent from client, single response received from server. */
    MethodType[MethodType["ClientStreaming"] = 1] = "ClientStreaming";
    /** Single request sent from client, stream of responses received from server. */
    MethodType[MethodType["ServerStreaming"] = 2] = "ServerStreaming";
    /** Both server and client can stream arbitrary number of requests and responses simultaneously. */
    MethodType[MethodType["DuplexStreaming"] = 3] = "DuplexStreaming";
})(MethodType || (exports.MethodType = MethodType = {}));
/**
 * A generic representation of a remote method.
 */
class Method {
    /**
     * Gets the fully qualified name of the method. On the server side, methods are dispatched
     * based on this name.
     */
    get FullName() {
        return Method.FullName(this.ServiceName, this.Name);
    }
    constructor(type, service, name, handler) {
        this.Type = type;
        this.ServiceName = service.constructor.name;
        this.Name = name;
        this.Handler = handler;
        this.service = service;
    }
    HandleError(error, response, context) {
        if (error instanceof MethodError_1.MethodError) {
            const { status, message } = error;
            response.error = message;
            response.status = status || context.Status;
            return;
        }
        response.status = enums_1.Status.INTERNAL;
        response.error = "Internal Server Error";
        throw error;
    }
    /**
     * Gets the fully qualified name of the method.
     * @param serviceName - The name of the service.
     * @param name - The name of the method.
     */
    static FullName(serviceName, name) {
        return serviceName + "." + name;
    }
}
exports.Method = Method;
/**
 * A non-generic representation of a remote unary method.
 */
class UnaryMethod extends Method {
    constructor(service, name, handler) {
        super(MethodType.Unary, service, name, handler);
    }
    /**
     * Invoke handler for the method.
     */
    async Invoke(request, context) {
        var _a;
        const response = {
            id: request.id,
            method: request.method,
            type: enums_1.DataType.UNARY_CLIENT,
        };
        try {
            if (request.type !== enums_1.DataType.UNARY_CLIENT)
                throw new MethodError_1.MethodError(enums_1.Status.UNIMPLEMENTED, `Method ${request.method} is a unary`);
            response.response = (_a = (await this.Handler(request.request, context))) !== null && _a !== void 0 ? _a : null;
            response.status = context.Status;
        }
        catch (error) {
            this.HandleError(error, response, context);
        }
        finally {
            return context.Send(response);
        }
    }
}
exports.UnaryMethod = UnaryMethod;
/**
 * A non-generic representation of a remote client streaming method.
 */
class ClientStreamingMethod extends Method {
    constructor(service, name, handler) {
        super(MethodType.ClientStreaming, service, name, handler);
    }
    /**
     * Invoke handler for the method.
     */
    async Invoke(request, context) {
        var _a;
        const response = {
            id: request.id,
            method: request.method,
            type: enums_1.DataType.STREAM_END,
        };
        try {
            if (request.type !== enums_1.DataType.STREAM_CLIENT)
                throw new MethodError_1.MethodError(enums_1.Status.UNIMPLEMENTED, `Method ${request.method} is a client streaming`);
            const requestStream = context.CreateClientStreamReader();
            response.response = (_a = (await this.Handler(requestStream, context))) !== null && _a !== void 0 ? _a : null;
            response.status = context.Status;
        }
        catch (error) {
            this.HandleError(error, response, context);
        }
        finally {
            return context.Send(response);
        }
    }
}
exports.ClientStreamingMethod = ClientStreamingMethod;
/**
 * A non-generic representation of a remote server streaming method.
 */
class ServerStreamingMethod extends Method {
    constructor(service, name, handler) {
        super(MethodType.ServerStreaming, service, name, handler);
    }
    /**
     * Invoke handler for the method.
     */
    async Invoke(request, context) {
        const response = {
            id: request.id,
            method: request.method,
            type: enums_1.DataType.STREAM_END,
        };
        try {
            if (request.type !== enums_1.DataType.STREAM_SERVER)
                throw new MethodError_1.MethodError(enums_1.Status.UNIMPLEMENTED, `Method ${request.method} is a server streaming`);
            const responseStream = context.CreateServerStreamWriter();
            await this.Handler(request.request, responseStream, context);
            response.status = context.Status;
        }
        catch (error) {
            this.HandleError(error, response, context);
        }
        finally {
            return context.Send(response);
        }
    }
}
exports.ServerStreamingMethod = ServerStreamingMethod;
/**
 * A non-generic representation of a remote duplex streaming method.
 */
class DuplexStreamingMethod extends Method {
    constructor(service, name, handler) {
        super(MethodType.DuplexStreaming, service, name, handler);
    }
    /**
     * Invoke handler for the method.
     *  @param request - The request object.
     */
    async Invoke(request, context) {
        const response = {
            id: request.id,
            method: request.method,
            type: enums_1.DataType.STREAM_END,
        };
        try {
            if (request.type !== enums_1.DataType.STREAM_DUPLEX)
                throw new MethodError_1.MethodError(enums_1.Status.UNIMPLEMENTED, `Method ${request.method} is a duplex streaming`);
            const requestStream = context.CreateClientStreamReader();
            const responseStream = context.CreateServerStreamWriter();
            await this.Handler(requestStream, responseStream, context);
            response.status = context.Status;
        }
        catch (error) {
            this.HandleError(error, response, context);
        }
        finally {
            return context.Send(response);
        }
    }
}
exports.DuplexStreamingMethod = DuplexStreamingMethod;
