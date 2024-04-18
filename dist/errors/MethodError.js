"use strict";
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
