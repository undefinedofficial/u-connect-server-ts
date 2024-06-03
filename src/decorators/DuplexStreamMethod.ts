/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */

import {
  ActionResultPromiceVoid,
  ActionResultVoid,
  IClientStreamReader,
  IServerStreamWriter,
} from "../interfaces";
import { IService } from "../interfaces/IService";
import {
  Method,
  ServerCallContext,
  DuplexStreamingMethod as DuplexStreamingMethodClass,
} from "../models";

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
  ) => {
    const method = descriptor.value!;
    if (!target.Methods) target.Methods = new Map<string, Method>();
    else if (target.Methods.has(name || propertyName))
      throw new Error(
        `DuplexMethod ${target.constructor.name}.${name || propertyName} already exists`
      );

    target.Methods.set(
      name || propertyName,
      new DuplexStreamingMethodClass(target, name || propertyName, method)
    );
  };
}
