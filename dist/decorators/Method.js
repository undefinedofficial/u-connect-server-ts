"use strict";
/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnaryMethod = UnaryMethod;
exports.ClientStreamMethod = ClientStreamMethod;
exports.ServerStreamMethod = ServerStreamMethod;
exports.DuplexStreamMethod = DuplexStreamMethod;
exports.LogMethod = LogMethod;
const models_1 = require("../models");
const Method = (target, methodName, type, handler) => {
    if (!target.Methods) {
        target.Methods = new Map();
    }
    else if (target.Methods.has(methodName))
        throw new Error(`Method ${target.constructor.name}.${methodName} already exists`);
    target.Methods.set(methodName, { type, handler });
};
/**
 * @type {Decorator}
 */
function UnaryMethod(name) {
    return (target, propertyName, descriptor) => Method(target, name || propertyName, models_1.MethodType.Unary, descriptor.value);
}
/**
 * @type {Decorator}
 */
function ClientStreamMethod(name) {
    return (target, propertyName, descriptor) => Method(target, name || propertyName, models_1.MethodType.ClientStreaming, descriptor.value);
}
/**
 * @type {Decorator}
 */
function ServerStreamMethod(name) {
    return (target, propertyName, descriptor) => Method(target, name || propertyName, models_1.MethodType.ServerStreaming, descriptor.value);
}
/**
 * @type {Decorator}
 */
function DuplexStreamMethod(name) {
    return (target, propertyName, descriptor) => Method(target, name || propertyName, models_1.MethodType.DuplexStreaming, descriptor.value);
}
/**
 * @type {Decorator}
 */
function LogMethod() {
    return (target, propertyName, descriptor) => {
        const method = descriptor.value;
        descriptor.value = function (...args) {
            const label = `${target.name}, ${propertyName || "LogTime"}`;
            console.time(label);
            const result = method.apply(this, args);
            console.timeEnd(label);
            return result;
        };
    };
}
