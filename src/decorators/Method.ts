/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */

import {
  ActionResultPromiceResponse,
  ActionResultResponse,
  ActionResultPromiceVoid,
  ActionResultVoid,
  IClientStreamReader,
  IServerStreamWriter,
} from "../interfaces";
import { IService } from "../interfaces/IService";
import { ServiceMethodsMap } from "../interfaces/ServiceMethodsMap";
import { ServerCallContext, MethodType } from "../models";

const Method = <TCall extends Function>(
  target: IService,
  methodName: string,
  type: MethodType,
  handler: TCall
) => {
  if (!target.Methods) {
    target.Methods = new Map() as ServiceMethodsMap;
  } else if (target.Methods.has(methodName))
    throw new Error(
      `Method ${target.constructor.name}.${methodName} already exists`
    );

  target.Methods.set(methodName, { type, handler });
};

export type ActionUnaryMethod<I, O> = (
  request: I,
  context: ServerCallContext
) => ActionResultPromiceResponse<O> | ActionResultResponse<O>;

/**
 * Extracts the input type from an ActionUnaryMethod
 */
export type ExtractUnaryInput<T> = T extends ActionUnaryMethod<infer I, any>
  ? I
  : never;
/**
 * Extracts the output type from an ActionUnaryMethod
 */
export type ExtractUnaryOutput<T> = T extends ActionUnaryMethod<any, infer O>
  ? O
  : never;

/**
 * @type {Decorator}
 */
export function UnaryMethod<M extends ActionUnaryMethod<any, any>>(
  name?: string
) {
  return (
    target: IService,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<
      ActionUnaryMethod<ExtractUnaryInput<M>, ExtractUnaryOutput<M>>
    >
  ) =>
    Method(target, name || propertyName, MethodType.Unary, descriptor.value!);
}

export type ActionClientStreamMethod<I extends IClientStreamReader<any>, O> = (
  request: I,
  context: ServerCallContext
) => ActionResultPromiceResponse<O> | ActionResultResponse<O>;

/**
 * @type {Decorator}
 */
export function ClientStreamMethod<
  I extends IClientStreamReader<any>,
  M extends ActionClientStreamMethod<any, any>
>(name?: string) {
  return (
    target: IService,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<
      ActionClientStreamMethod<I, ReturnType<M>>
    >
  ) =>
    Method(
      target,
      name || propertyName,
      MethodType.ClientStreaming,
      descriptor.value!
    );
}

export type ActionServerStreamMethod<I, O> = (
  request: I,
  responseStream: O,
  context: ServerCallContext
) => ActionResultPromiceVoid | ActionResultVoid;

/**
 * @type {Decorator}
 */
export function ServerStreamMethod<
  O extends IServerStreamWriter<any>,
  M extends ActionServerStreamMethod<any, any>
>(name?: string) {
  return (
    target: IService,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<
      ActionServerStreamMethod<Parameters<M>[0], O>
    >
  ) =>
    Method(
      target,
      name || propertyName,
      MethodType.ServerStreaming,
      descriptor.value!
    );
}

export type ActionDuplexStreamMethod<I, O> = (
  requestStream: I,
  responseStream: O,
  context: ServerCallContext
) => ActionResultPromiceVoid | ActionResultVoid;

/**
 * @type {Decorator}
 */
export function DuplexStreamMethod<
  I extends IClientStreamReader<any>,
  O extends IServerStreamWriter<any>
>(name?: string) {
  return (
    target: IService,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<ActionDuplexStreamMethod<I, O>>
  ) =>
    Method(
      target,
      name || propertyName,
      MethodType.DuplexStreaming,
      descriptor.value!
    );
}

/**
 * @type {Decorator}
 */
export function LogMethod() {
  return (
    target: IService,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<Function>
  ) => {
    const method = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const label = `${target.name}, ${propertyName || "LogTime"}`;
      console.time(label);
      const result = method!.apply(this, args);
      console.timeEnd(label);
      return result;
    };
  };
}
