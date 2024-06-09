"use strict";
/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseError = void 0;
class ResponseError extends Error {
    constructor(id, method, status, message) {
        super(message);
        this.id = id;
        this.method = method;
        this.status = status;
        this.name = "ResponseError";
    }
}
exports.ResponseError = ResponseError;
