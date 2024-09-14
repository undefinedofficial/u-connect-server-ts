/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
export class ResponseError extends Error {
    id;
    method;
    status;
    constructor(id, method, status, message) {
        super(message);
        this.id = id;
        this.method = method;
        this.status = status;
        this.name = "ResponseError";
    }
}
