/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
import { encode } from "@msgpack/msgpack";
export class Response {
    id;
    method;
    type;
    response;
    status;
    meta;
    error;
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
        return encode([
            id,
            method,
            type,
            response ?? null,
            status ?? null,
            meta ?? null,
            error ?? null,
        ]);
    }
}
