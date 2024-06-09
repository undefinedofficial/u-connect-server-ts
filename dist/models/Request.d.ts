/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
import { DataType } from "../enums";
export declare class Request<P> {
    readonly id: number;
    readonly method: string;
    readonly type: DataType;
    readonly request?: P | null | undefined;
    readonly meta?: Readonly<{
        [x: string]: string;
    }> | null | undefined;
    constructor(id: number, method: string, type: DataType, request?: P | null | undefined, meta?: Readonly<{
        [x: string]: string;
    }> | null | undefined);
    static Deserialize<T>(data: ArrayLike<number> | BufferSource): Request<T>;
}
//# sourceMappingURL=Request.d.ts.map