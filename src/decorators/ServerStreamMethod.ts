import { ActionResultPromiceVoid, ActionResultVoid, IServerStreamWriter } from "../interfaces";
import { IService } from "../interfaces/IService";
import {
  Method,
  ServerCallContext,
  ServerStreamingMethod as ServerStreamingMethodClass,
} from "../models";

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
    descriptor: TypedPropertyDescriptor<ActionServerStreamMethod<Parameters<M>[0], O>>
  ) => {
    const method = descriptor.value!;
    if (!target.Methods) target.Methods = new Map<string, Method>();
    else if (target.Methods.has(name || propertyName))
      throw new Error(
        `ServerStreamMethod ${target.constructor.name}.${name || propertyName} already exists`
      );

    target.Methods.set(
      name || propertyName,
      new ServerStreamingMethodClass(target, name || propertyName, method)
    );
  };
}
