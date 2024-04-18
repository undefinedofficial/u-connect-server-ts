"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplexStreamingMethod = exports.ServerStreamingMethod = exports.ClientStreamingMethod = exports.UnaryMethod = exports.Method = void 0;
const MethodError_1 = require("../errors/MethodError");
/**
 * A generic representation of a remote method.
 */
class Method {
    constructor(type, service, name, handler) {
        this.Type = type;
        this.ServiceName = service.constructor.name;
        this.Name = name;
        this.Handler = handler;
        this.service = service;
    }
    /**
     * Gets the fully qualified name of the method. On the server side, methods are dispatched
     * based on this name.
     */
    get FullName() {
        return Method.FullName(this.ServiceName, this.Name);
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
        super(0 /* MethodType.Unary */, service, name, handler);
    }
    /**
     * Invoke handler for the method.
     */
    async Invoke(request, context) {
        var _a;
        const response = {
            id: request.id,
            method: request.method,
            type: 3 /* DataType.UNARY_CLIENT */,
        };
        try {
            response.response = (_a = (await this.Handler(request.request, context))) !== null && _a !== void 0 ? _a : null;
            response.status = context.Status;
        }
        catch (error) {
            if (!(error instanceof MethodError_1.MethodError))
                throw error;
            const { status, message } = error;
            response.error = message;
            response.status = status || context.Status;
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
        super(1 /* MethodType.ClientStreaming */, service, name, handler);
    }
    /**
     * Invoke handler for the method.
     */
    async Invoke(request, context) {
        var _a;
        const response = {
            id: request.id,
            method: request.method,
            type: 8 /* DataType.STREAM_END */,
        };
        try {
            const requestStream = context.CreateClientStreamReader();
            response.response = (_a = (await this.Handler(requestStream, context))) !== null && _a !== void 0 ? _a : null;
            response.status = context.Status;
        }
        catch (error) {
            if (!(error instanceof MethodError_1.MethodError))
                throw error;
            const { status, message } = error;
            response.error = message;
            response.status = status || context.Status;
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
        super(2 /* MethodType.ServerStreaming */, service, name, handler);
    }
    /**
     * Invoke handler for the method.
     */
    async Invoke(request, context) {
        const response = {
            id: request.id,
            method: request.method,
            type: 8 /* DataType.STREAM_END */,
        };
        try {
            const responseStream = context.CreateServerStreamWriter();
            await this.Handler(request.request, responseStream, context);
            response.status = context.Status;
        }
        catch (error) {
            if (!(error instanceof MethodError_1.MethodError))
                throw error;
            const { status, message } = error;
            response.error = message;
            response.status = status || context.Status;
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
        super(3 /* MethodType.DuplexStreaming */, service, name, handler);
    }
    /**
     * Invoke handler for the method.
     *  @param request - The request object.
     */
    async Invoke(request, context) {
        const response = {
            id: request.id,
            method: request.method,
            type: 8 /* DataType.STREAM_END */,
        };
        try {
            const requestStream = context.CreateClientStreamReader();
            const responseStream = context.CreateServerStreamWriter();
            await this.Handler(requestStream, responseStream, context);
            response.status = context.Status;
        }
        catch (error) {
            if (!(error instanceof MethodError_1.MethodError))
                throw error;
            const { status, message } = error;
            response.error = message;
            response.status = status || context.Status;
        }
        finally {
            return context.Send(response);
        }
    }
}
exports.DuplexStreamingMethod = DuplexStreamingMethod;
