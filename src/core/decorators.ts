import type { ServerCallContext } from "./ServerCallContext";
import {
  type IClientStreamReader,
  type IServerStreamWriter,
  type MiddlewareFn,
  type ServiceMetadata,
  MethodType,
  RPC_METADATA,
  TransformerFn,
} from "./types";

export function getOrCreateMetadata(target: any): ServiceMetadata {
  const prototype = typeof target === "function" ? target.prototype : target;
  if (!Object.prototype.hasOwnProperty.call(prototype, RPC_METADATA)) {
    Object.defineProperty(prototype, RPC_METADATA, {
      value: { methods: new Map() } satisfies ServiceMetadata,
      writable: false,
      enumerable: false,
      configurable: false,
    });
  }
  return prototype[RPC_METADATA];
}

/**
 * Универсальная фабрика для создания RPC-декораторов (Unary, Duplex и т.д.)
 */
function createMethodDecorator<Value>(type: MethodType, customName?: string) {
  return function (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<Value>) {
    const metadata = getOrCreateMetadata(target);

    const methodMetadata = metadata.methods.get(propertyKey) ?? {};
    methodMetadata.type = type;
    methodMetadata.name = customName ?? String(propertyKey);
    metadata.methods.set(propertyKey, methodMetadata);

    return target;
  };
}

export type UnaryHandler<I = any, O = any> = (data: I, context: ServerCallContext) => Promise<O> | O;

export type ClientStreamHandler<I = any, O = any> = (
  clientReader: IClientStreamReader<I>,
  context: ServerCallContext,
) => Promise<O> | O;

export type ServerStreamHandler<I = any, O = any> = (
  data: I,
  serverStream: IServerStreamWriter<O>,
  context: ServerCallContext,
) => Promise<any> | any;

export type DuplexStreamHandler<I = any, O = any> = (
  clientReader: IClientStreamReader<I>,
  serverStream: IServerStreamWriter<O>,
  context: ServerCallContext,
) => Promise<any> | any;

export const UnaryMethod = (name?: string) => createMethodDecorator<UnaryHandler<any, any>>(MethodType.Unary, name);
export const ClientStreamMethod = (name?: string) =>
  createMethodDecorator<ClientStreamHandler<any, any>>(MethodType.ClientStreaming, name);
export const ServerStreamMethod = (name?: string) =>
  createMethodDecorator<ServerStreamHandler<any, any>>(MethodType.ServerStreaming, name);
export const DuplexStreamMethod = (name?: string) =>
  createMethodDecorator<DuplexStreamHandler<any, any>>(MethodType.DuplexStreaming, name);

export function Service(name?: string) {
  return function (target: any) {
    const metadata = getOrCreateMetadata(target);
    metadata.name = name;
  };
}

export function Middleware(mw: MiddlewareFn) {
  return function (
    target: any,
    propertyKey?: string | symbol,
    descriptor?:
      | TypedPropertyDescriptor<UnaryHandler<any, any>>
      | TypedPropertyDescriptor<ClientStreamHandler<any, any>>
      | TypedPropertyDescriptor<ServerStreamHandler<any, any>>
      | TypedPropertyDescriptor<DuplexStreamHandler<any, any>>,
  ) {
    const metadata = getOrCreateMetadata(target);

    if (!propertyKey) {
      // Middleware для всего Хаба
      metadata.middlewares ??= [];
      metadata.middlewares.push(mw);
    } else {
      // Middleware для метода
      const metadataMethod = metadata.methods.get(propertyKey) ?? {};

      metadataMethod.middlewares ??= [];
      metadataMethod.middlewares.push(mw);
      metadata.methods.set(propertyKey, metadataMethod);
    }

    return target;
  };
}

export type ExtractMethodInput<T> = T extends (i: infer I, ...args: any[]) => any
  ? I extends IClientStreamReader<infer R>
    ? R
    : I
  : never;

export function Transformer<
  M extends
    | UnaryHandler<any, any>
    | ClientStreamHandler<any, any>
    | ServerStreamHandler<any, any>
    | DuplexStreamHandler<any, any>,
>(fn: TransformerFn<unknown, ExtractMethodInput<M>>) {
  return function (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<M>) {
    const metadata = getOrCreateMetadata(target);
    const methodMeta = metadata.methods.get(propertyKey as string) ?? {
      name: propertyKey as string,
      type: MethodType.Unary,
      middlewares: [],
    };

    if (methodMeta.transformer) {
      throw new Error(`Method ${String(propertyKey)} already has a transformer. Only one is allowed.`);
    }

    methodMeta.transformer = fn;
    metadata.methods.set(propertyKey as string, methodMeta);
  };
}
