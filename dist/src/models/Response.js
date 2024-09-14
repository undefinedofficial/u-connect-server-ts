"use strict";
/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Response = void 0;
const msgpack_1 = require("@msgpack/msgpack");
class Response {
    /**
     *
     */
    constructor(id, method, type, response, status, meta, error) {
        this.id = id;
        this.method = method;
        this.type = type;
        this.response = response;
        this.status = status;
        this.meta = meta;
        this.error = error;
    }
    static Serialize({ id, method, type, response, status, meta, error, }) {
        return (0, msgpack_1.encode)([
            id,
            method,
            type,
            response !== null && response !== void 0 ? response : null,
            status !== null && status !== void 0 ? status : null,
            meta !== null && meta !== void 0 ? meta : null,
            error !== null && error !== void 0 ? error : null,
        ]);
    }
}
exports.Response = Response;
