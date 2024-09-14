/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
import { ActionResultPromiceVoid, ActionResultVoid, IClientStreamReader, IServerStreamWriter } from "../interfaces";
import { IService } from "../interfaces/IService";
import { ServerCallContext } from "../models";
export type ActionDuplexStreamMethod<I, O> = (requestStream: I, responseStream: O, context: ServerCallContext) => ActionResultPromiceVoid | ActionResultVoid;
/**
 * @type {Decorator}
 */
export declare function DuplexStreamMethod<I extends IClientStreamReader<any>, O extends IServerStreamWriter<any>>(name?: string): (target: IService, propertyName: string, descriptor: TypedPropertyDescriptor<ActionDuplexStreamMethod<I, O>>) => void;
//# sourceMappingURL=DuplexStreamMethod.d.ts.map