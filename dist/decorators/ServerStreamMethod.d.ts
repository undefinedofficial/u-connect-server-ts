import { ActionResultPromiceVoid, ActionResultVoid, IServerStreamWriter } from "../interfaces";
import { IService } from "../interfaces/IService";
import { ServerCallContext } from "../models";
export type ActionServerStreamMethod<I, O> = (request: I, responseStream: O, context: ServerCallContext) => ActionResultPromiceVoid | ActionResultVoid;
/**
 * @type {Decorator}
 */
export declare function ServerStreamMethod<O extends IServerStreamWriter<any>, M extends ActionServerStreamMethod<any, any>>(name?: string): (target: IService, propertyName: string, descriptor: TypedPropertyDescriptor<ActionServerStreamMethod<Parameters<M>[0], O>>) => void;
//# sourceMappingURL=ServerStreamMethod.d.ts.map