/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */

import { ActionResultPromiceResponse, ActionResultResponse } from "../interfaces";
import { IService } from "../interfaces/IService";
import { Method, ServerCallContext, UnaryMethod as UnaryMethodClass } from "../models";

export type ActionUnaryMethod<I, O> = (
  request: I,
  context: ServerCallContext
) => ActionResultPromiceResponse<O> | ActionResultResponse<O>;

/**
 * Extracts the input type from an ActionUnaryMethod
 */
export type ExtractUnaryInput<T> = T extends ActionUnaryMethod<infer I, any> ? I : never;
/**
 * Extracts the output type from an ActionUnaryMethod
 */
export type ExtractUnaryOutput<T> = T extends ActionUnaryMethod<any, infer O> ? O : never;

/**
 * @type {Decorator}
 */
export function UnaryMethod<M extends ActionUnaryMethod<any, any>>(name?: string) {
  return (
    target: IService,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<
      ActionUnaryMethod<ExtractUnaryInput<M>, ExtractUnaryOutput<M>>
    >
  ) => {
    const method = descriptor.value!;
    if (!target.Methods) target.Methods = new Map<string, Method>();
    else if (target.Methods.has(name || propertyName))
      throw new Error(
        `UnaryMethod ${target.constructor.name}.${name || propertyName} already exists`
      );

    target.Methods.set(
      name || propertyName,
      new UnaryMethodClass(target, name || propertyName, method)
    );
  };
}
