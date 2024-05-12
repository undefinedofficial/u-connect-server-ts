"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = void 0;
const msgpack_1 = require("@msgpack/msgpack");
class Request {
    constructor(id, method, type, request, meta) {
        this.id = id;
        this.method = method;
        this.type = type;
        this.request = request;
        this.meta = meta;
    }
    static Deserialize(data) {
        const [id, method, type, request, meta] = (0, msgpack_1.decode)(data);
        return new Request(id, method, type, request, meta);
    }
}
exports.Request = Request;
