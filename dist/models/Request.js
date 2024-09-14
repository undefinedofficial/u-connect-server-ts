/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
import { decode } from "@msgpack/msgpack";
export class Request {
    id;
    method;
    type;
    request;
    meta;
    constructor(id, method, type, request, meta) {
        this.id = id;
        this.method = method;
        this.type = type;
        this.request = request;
        this.meta = meta;
    }
    static Deserialize(data) {
        const [id, method, type, request, meta] = decode(data);
        return new Request(id, method, type, request, meta);
    }
}
