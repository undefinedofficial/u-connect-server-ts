import { ActionResultPromiceResponse, ActionResultResponse } from "../interfaces";
import { IService } from "../interfaces/IService";
import { Method, ServerCallContext, UnaryMethod as UnaryMethodClass } from "../models";

export type ActionUnaryMethod<I, O> = (
  request: I,
  context: ServerCallContext
) => ActionResultPromiceResponse<O> | ActionResultResponse<O>;

/**
 * @type {Decorator}
 */
export function UnaryMethod<M extends ActionUnaryMethod<any, any>>(name?: string) {
  return (
    target: IService,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<ActionUnaryMethod<Parameters<M>[0], ReturnType<M>>>
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
