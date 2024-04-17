import {
  ActionResultPromiceResponse,
  ActionResultResponse,
  IClientStreamReader,
} from "../interfaces";
import { IService } from "../interfaces/IService";
import {
  Method,
  ServerCallContext,
  ClientStreamingMethod as ClientStreamMethodClass,
} from "../models";

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
    descriptor: TypedPropertyDescriptor<ActionClientStreamMethod<I, ReturnType<M>>>
  ) => {
    const method = descriptor.value!;
    if (!target.Methods) target.Methods = new Map<string, Method>();
    else if (target.Methods.has(name || propertyName))
      throw new Error(
        `ClientStreamMethod ${target.constructor.name}.${name || propertyName} already exists`
      );

    target.Methods.set(
      name || propertyName,
      new ClientStreamMethodClass(target, name || propertyName, method)
    );
  };
}
