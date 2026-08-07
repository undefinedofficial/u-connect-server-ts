import { I as ITransport, a as ISerializer, b as IClientStreamReader, S as ServerCallContext, c as IServerStreamWriter, M as MiddlewareFn, T as TransformerFn, d as ServiceMetadata, e as Status } from '../types-DvKae193.js';
export { C as CancellationToken, f as CancellationTokenSource, g as ClientStreamReader, D as Dispatcher, h as IConnection, i as MethodMetadata, j as MethodType, P as PackageID, k as PackageType, R as RPC_METADATA, l as RequestMetadata, m as ResponseMetadata, n as ServerCallContextSource, o as ServerStreamWriter } from '../types-DvKae193.js';

declare class Builder {
    private _transport?;
    private _serializer?;
    private _processor;
    private _registry;
    constructor();
    withTransport(transport: ITransport): this;
    withSerializer(serializer: ISerializer): this;
    addService<TService extends new (...args: any[]) => any>(service: TService, ...args: ConstructorParameters<TService>): this;
    build(): Omit<ITransport, "bindDispatcher">;
}

declare function getOrCreateMetadata(target: any): ServiceMetadata;
type UnaryHandler<I = any, O = any> = (data: I, context: ServerCallContext) => Promise<O> | O;
type ClientStreamHandler<I = any, O = any> = (clientReader: IClientStreamReader<I>, context: ServerCallContext) => Promise<O> | O;
type ServerStreamHandler<I = any, O = any> = (data: I, serverStream: IServerStreamWriter<O>, context: ServerCallContext) => Promise<any> | any;
type DuplexStreamHandler<I = any, O = any> = (clientReader: IClientStreamReader<I>, serverStream: IServerStreamWriter<O>, context: ServerCallContext) => Promise<any> | any;
declare const UnaryMethod: (name?: string) => (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<UnaryHandler<any, any>>) => Object;
declare const ClientStreamMethod: (name?: string) => (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<ClientStreamHandler<any, any>>) => Object;
declare const ServerStreamMethod: (name?: string) => (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<ServerStreamHandler<any, any>>) => Object;
declare const DuplexStreamMethod: (name?: string) => (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<DuplexStreamHandler<any, any>>) => Object;
declare function Service(name?: string): (target: any) => void;
declare function Middleware(mw: MiddlewareFn): (target: any, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<UnaryHandler<any, any>> | TypedPropertyDescriptor<ClientStreamHandler<any, any>> | TypedPropertyDescriptor<ServerStreamHandler<any, any>> | TypedPropertyDescriptor<DuplexStreamHandler<any, any>>) => any;
type ExtractMethodInput<T> = T extends (i: infer I, ...args: any[]) => any ? I extends IClientStreamReader<infer R> ? R : I : never;
declare function Transformer<M extends UnaryHandler<any, any> | ClientStreamHandler<any, any> | ServerStreamHandler<any, any> | DuplexStreamHandler<any, any>>(fn: TransformerFn<unknown, ExtractMethodInput<M>>): (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<M>) => void;

declare class MethodError extends Error {
    readonly status: Status;
    constructor(status: Status, message: string);
}

export { Builder, ClientStreamMethod, DuplexStreamMethod, IClientStreamReader, ISerializer, IServerStreamWriter, ITransport, MethodError, Middleware, MiddlewareFn, ServerCallContext, ServerStreamMethod, Service, ServiceMetadata, Status, Transformer, TransformerFn, UnaryMethod, getOrCreateMetadata };
export type { ClientStreamHandler, DuplexStreamHandler, ExtractMethodInput, ServerStreamHandler, UnaryHandler };
