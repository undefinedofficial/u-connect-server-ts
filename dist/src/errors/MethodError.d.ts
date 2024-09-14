/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
import { Status } from "../enums";
export declare class MethodError extends Error {
    readonly status: Status;
    constructor(status: Status, message: string);
}
//# sourceMappingURL=MethodError.d.ts.map