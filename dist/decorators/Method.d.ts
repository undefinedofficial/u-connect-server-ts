/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
import { ActionResultPromiceResponse, ActionResultResponse, ActionResultPromiceVoid, ActionResultVoid, IClientStreamReader, IServerStreamWriter } from "../interfaces";
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
export type ActionClientStreamMethod<I extends IClientStreamReader<any>, O> = (request: I, context: ServerCallContext) => ActionResultPromiceResponse<O> | ActionResultResponse<O>;
/**
 * @type {Decorator}
 */
export declare function ClientStreamMethod<I extends IClientStreamReader<any>, M extends ActionClientStreamMethod<any, any>>(name?: string): (target: IService, propertyName: string, descriptor: TypedPropertyDescriptor<ActionClientStreamMethod<I, ReturnType<M>>>) => void;
export type ActionServerStreamMethod<I, O> = (request: I, responseStream: O, context: ServerCallContext) => ActionResultPromiceVoid | ActionResultVoid;
/**
 * @type {Decorator}
 */
export declare function ServerStreamMethod<O extends IServerStreamWriter<any>, M extends ActionServerStreamMethod<any, any>>(name?: string): (target: IService, propertyName: string, descriptor: TypedPropertyDescriptor<ActionServerStreamMethod<Parameters<M>[0], O>>) => void;
export type ActionDuplexStreamMethod<I, O> = (requestStream: I, responseStream: O, context: ServerCallContext) => ActionResultPromiceVoid | ActionResultVoid;
/**
 * @type {Decorator}
 */
export declare function DuplexStreamMethod<I extends IClientStreamReader<any>, O extends IServerStreamWriter<any>>(name?: string): (target: IService, propertyName: string, descriptor: TypedPropertyDescriptor<ActionDuplexStreamMethod<I, O>>) => void;
/**
 * @type {Decorator}
 */
export declare function LogMethod(): (target: IService, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) => void;
//# sourceMappingURL=Method.d.ts.map