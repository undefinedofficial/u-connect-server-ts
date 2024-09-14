/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
import { DataType, Status } from "../enums";
import { MethodError } from "../errors/MethodError";
/**  Method types supported by u-connect. */
export var MethodType;
(function (MethodType) {
    /** Single request sent from client, single response received from server. */
    MethodType[MethodType["Unary"] = 0] = "Unary";
    /** Stream of request sent from client, single response received from server. */
    MethodType[MethodType["ClientStreaming"] = 1] = "ClientStreaming";
    /** Single request sent from client, stream of responses received from server. */
    MethodType[MethodType["ServerStreaming"] = 2] = "ServerStreaming";
    /** Both server and client can stream arbitrary number of requests and responses simultaneously. */
    MethodType[MethodType["DuplexStreaming"] = 3] = "DuplexStreaming";
})(MethodType || (MethodType = {}));
/**
 * A generic representation of a remote method.
 */
export class Method {
    /**
     * Gets the type of the method.
     */
    Type;
    /**
     * Gets the name of the service to which this method belongs.
     */
    ServiceName;
    /**
     *  Gets the unqualified name of the method.
     */
    Name;
    /**
     * Gets the fully qualified name of the method. On the server side, methods are dispatched
     * based on this name.
     */
    get FullName() {
        return Method.FullName(this.ServiceName, this.Name);
    }
    /**
     * handler for the method.
     */
    Handler;
    /**
     * Gets the service to which this method belongs.
     */
    service;
    constructor(type, service, name, handler) {
        this.Type = type;
        this.ServiceName = service.constructor.name;
        this.Name = name;
        this.Handler = handler;
        this.service = service;
    }
    HandleError(error, response, context) {
        if (error instanceof MethodError) {
            const { status, message } = error;
            response.error = message;
            response.status = status || context.Status;
            return;
        }
        response.status = Status.INTERNAL;
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
/**
 * A non-generic representation of a remote unary method.
 */
export class UnaryMethod extends Method {
    constructor(service, name, handler) {
        super(MethodType.Unary, service, name, handler);
    }
    /**
     * Invoke handler for the method.
     */
    async Invoke(request, context) {
        const response = {
            id: request.id,
            method: request.method,
            type: DataType.UNARY_CLIENT,
        };
        try {
            if (request.type !== DataType.UNARY_CLIENT)
                throw new MethodError(Status.UNIMPLEMENTED, `Method ${request.method} is a unary`);
            response.response = (await this.Handler(request.request, context)) ?? null;
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
/**
 * A non-generic representation of a remote client streaming method.
 */
export class ClientStreamingMethod extends Method {
    constructor(service, name, handler) {
        super(MethodType.ClientStreaming, service, name, handler);
    }
    /**
     * Invoke handler for the method.
     */
    async Invoke(request, context) {
        const response = {
            id: request.id,
            method: request.method,
            type: DataType.STREAM_END,
        };
        try {
            if (request.type !== DataType.STREAM_CLIENT)
                throw new MethodError(Status.UNIMPLEMENTED, `Method ${request.method} is a client streaming`);
            const requestStream = context.CreateClientStreamReader();
            response.response = (await this.Handler(requestStream, context)) ?? null;
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
/**
 * A non-generic representation of a remote server streaming method.
 */
export class ServerStreamingMethod extends Method {
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
            type: DataType.STREAM_END,
        };
        try {
            if (request.type !== DataType.STREAM_SERVER)
                throw new MethodError(Status.UNIMPLEMENTED, `Method ${request.method} is a server streaming`);
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
/**
 * A non-generic representation of a remote duplex streaming method.
 */
export class DuplexStreamingMethod extends Method {
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
            type: DataType.STREAM_END,
        };
        try {
            if (request.type !== DataType.STREAM_DUPLEX)
                throw new MethodError(Status.UNIMPLEMENTED, `Method ${request.method} is a duplex streaming`);
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
