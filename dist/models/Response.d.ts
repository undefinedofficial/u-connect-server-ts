/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
import { Status, DataType } from "../enums";
import { ResponseMetadata } from "../interfaces/Metadata";
export declare class Response<P> {
    readonly id: string;
    readonly method: string;
    type: DataType;
    response?: (P | null) | undefined;
    status?: (Status | null) | undefined;
    meta?: (ResponseMetadata | null) | undefined;
    error?: string | null | undefined;
    /**
     *
     */
    constructor(id: string, method: string, type: DataType, response?: (P | null) | undefined, status?: (Status | null) | undefined, meta?: (ResponseMetadata | null) | undefined, error?: string | null | undefined);
    static Serialize<T>({ id, method, type, response, status, meta, error, }: Response<T>): Uint8Array;
}
//# sourceMappingURL=Response.d.ts.map