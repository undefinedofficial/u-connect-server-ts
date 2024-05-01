import { IRequest, IResponse } from "../interfaces";
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
/**
 * A generic representation of a remote method.
 */
export declare abstract class Method {
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
    Handler: (...args: any[]) => Promise<any>;
    /**
     * Gets the service to which this method belongs.
     */
    service: Object;
    constructor(type: MethodType, service: Object, name: string, handler: (...args: any[]) => any);
    abstract Invoke<I>(request: IRequest<I>, context: ServerCallContext): Promise<void>;
    protected HandleError(error: unknown, response: IResponse<any>, context: ServerCallContext): void;
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
export declare class UnaryMethod<I extends IRequest<any>, O extends IResponse<any>> extends Method {
    constructor(service: Object, name: string, handler: (...args: any[]) => any);
    /**
     * Invoke handler for the method.
     */
    Invoke<I, O>(request: IRequest<I>, context: ServerCallContextSource): Promise<void>;
}
/**
 * A non-generic representation of a remote client streaming method.
 */
export declare class ClientStreamingMethod<I, O> extends Method {
    constructor(service: Object, name: string, handler: (...args: any[]) => any);
    /**
     * Invoke handler for the method.
     */
    Invoke<I, O>(request: IRequest<I>, context: ServerCallContextSource): Promise<void>;
}
/**
 * A non-generic representation of a remote server streaming method.
 */
export declare class ServerStreamingMethod<I, O> extends Method {
    constructor(service: Object, name: string, handler: (...args: any[]) => any);
    /**
     * Invoke handler for the method.
     */
    Invoke<I, O>(request: IRequest<I>, context: ServerCallContextSource): Promise<void>;
}
/**
 * A non-generic representation of a remote duplex streaming method.
 */
export declare class DuplexStreamingMethod<I, O> extends Method {
    constructor(service: Object, name: string, handler: (...args: any[]) => any);
    /**
     * Invoke handler for the method.
     *  @param request - The request object.
     */
    Invoke<I, O>(request: IRequest<I>, context: ServerCallContextSource): Promise<void>;
}
//# sourceMappingURL=Method.d.ts.map