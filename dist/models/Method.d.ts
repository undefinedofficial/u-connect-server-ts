/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
import { Request } from "./Request";
import { Response } from "./Response";
import { ServerCallContext, ServerCallContextSource } from "./ServerCallContext";
/**  Method types supported by u-connect. */
export declare const enum MethodType {
    /** Single request sent from client, single response received from server. */
    Unary = 0,
    /** Stream of request sent from client, single response received from server. */
    ClientStreaming = 1,
    /** Single request sent from client, stream of responses received from server. */
    ServerStreaming = 2,
    /** Both server and client can stream arbitrary number of requests and responses simultaneously. */
    DuplexStreaming = 3
}
export interface IMethod {
    Type: MethodType;
    ServiceName: string;
    Name: string;
    FullName: string;
    Invoke<I>(request: Request<I>, context: ServerCallContextSource): Promise<void>;
}
/**
 * A generic representation of a remote method.
 */
export declare abstract class Method implements IMethod {
    /**
     * Gets the type of the method.
     */
    readonly Type: MethodType;
    /**
     * Gets the name of the service to which this method belongs.
     */
    readonly ServiceName: string;
    /**
     *  Gets the unqualified name of the method.
     */
    readonly Name: string;
    /**
     * Gets the fully qualified name of the method. On the server side, methods are dispatched
     * based on this name.
     */
    get FullName(): string;
    /**
     * handler for the method.
     */
    protected Handler: (...args: any[]) => Promise<any>;
    constructor(type: MethodType, serviceName: string, name: string, handler: (...args: any[]) => any);
    abstract Invoke<I>(request: Request<I>, context: ServerCallContext): Promise<void>;
    protected HandleError(error: unknown, response: Response<any>, context: ServerCallContext): void;
    /**
     * Gets the fully qualified name of the method.
     * @param serviceName - The name of the service.
     * @param name - The name of the method.
     */
    static FullName(serviceName: string, name: string): string;
}
/**
 * A non-generic representation of a remote unary method.
 */
export declare class UnaryMethod<I extends Request<any>, O extends Response<any>> extends Method {
    constructor(serviceName: string, name: string, handler: (...args: any[]) => any);
    /**
     * Invoke handler for the method.
     */
    Invoke<I, O>(request: Request<I>, context: ServerCallContextSource): Promise<void>;
}
/**
 * A non-generic representation of a remote client streaming method.
 */
export declare class ClientStreamingMethod<I, O> extends Method {
    constructor(serviceName: string, name: string, handler: (...args: any[]) => any);
    /**
     * Invoke handler for the method.
     */
    Invoke<I, O>(request: Request<I>, context: ServerCallContextSource): Promise<void>;
}
/**
 * A non-generic representation of a remote server streaming method.
 */
export declare class ServerStreamingMethod<I, O> extends Method {
    constructor(serviceName: string, name: string, handler: (...args: any[]) => any);
    /**
     * Invoke handler for the method.
     */
    Invoke<I, O>(request: Request<I>, context: ServerCallContextSource): Promise<void>;
}
/**
 * A non-generic representation of a remote duplex streaming method.
 */
export declare class DuplexStreamingMethod<I, O> extends Method {
    constructor(serviceName: string, name: string, handler: (...args: any[]) => any);
    /**
     * Invoke handler for the method.
     *  @param request - The request object.
     */
    Invoke<I, O>(request: Request<I>, context: ServerCallContextSource): Promise<void>;
}
//# sourceMappingURL=Method.d.ts.map