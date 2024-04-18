import { ActionResultPromiceResponse, ActionResultResponse } from "../interfaces";
import { IService } from "../interfaces/IService";
import { ServerCallContext } from "../models";
export declare type ActionUnaryMethod<I, O> = (request: I, context: ServerCallContext) => ActionResultPromiceResponse<O> | ActionResultResponse<O>;
/**
 * @type {Decorator}
 */
export declare function UnaryMethod<M extends ActionUnaryMethod<any, any>>(name?: string): (target: IService, propertyName: string, descriptor: TypedPropertyDescriptor<ActionUnaryMethod<Parameters<M>[0], ReturnType<M>>>) => void;
//# sourceMappingURL=UnaryMethod.d.ts.map