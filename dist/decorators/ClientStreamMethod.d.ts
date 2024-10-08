/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
import { ActionResultPromiceResponse, ActionResultResponse, IClientStreamReader } from "../interfaces";
import { IService } from "../interfaces/IService";
import { ServerCallContext } from "../models";
export type ActionClientStreamMethod<I extends IClientStreamReader<any>, O> = (request: I, context: ServerCallContext) => ActionResultPromiceResponse<O> | ActionResultResponse<O>;
/**
 * @type {Decorator}
 */
export declare function ClientStreamMethod<I extends IClientStreamReader<any>, M extends ActionClientStreamMethod<any, any>>(name?: string): (target: IService, propertyName: string, descriptor: TypedPropertyDescriptor<ActionClientStreamMethod<I, ReturnType<M>>>) => void;
//# sourceMappingURL=ClientStreamMethod.d.ts.map