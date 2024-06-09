/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
import { Status } from "../enums";
export declare class ResponseError extends Error {
    id: number;
    method: string;
    status: Status;
    constructor(id: number, method: string, status: Status, message: string);
}
//# sourceMappingURL=ResponseError.d.ts.map