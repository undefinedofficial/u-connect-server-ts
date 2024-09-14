"use strict";
/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MethodError = void 0;
class MethodError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = "MethodError";
    }
}
exports.MethodError = MethodError;
