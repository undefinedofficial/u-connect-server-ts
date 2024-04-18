"use strict";
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
