import { ActionResultPromiceResponse, ActionResultResponse } from "../interfaces";
import { IService } from "../interfaces/IService";
import { ServerCallContext } from "../models";
export type ActionUnaryMethod<I, O> = (request: I, context: ServerCallContext) => ActionResultPromiceResponse<O> | ActionResultResponse<O>;
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
export declare function UnaryMethod<M extends ActionUnaryMethod<any, any>>(name?: string): (target: IService, propertyName: string, descriptor: TypedPropertyDescriptor<ActionUnaryMethod<ExtractUnaryInput<M>, ExtractUnaryOutput<M>>>) => void;
//# sourceMappingURL=UnaryMethod.d.ts.map