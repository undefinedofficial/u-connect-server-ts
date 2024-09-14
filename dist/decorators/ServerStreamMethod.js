"use strict";
/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerStreamMethod = void 0;
const models_1 = require("../models");
/**
 * @type {Decorator}
 */
function ServerStreamMethod(name) {
    return (target, propertyName, descriptor) => {
        const method = descriptor.value;
        if (!target.Methods)
            target.Methods = new Map();
        else if (target.Methods.has(name || propertyName))
            throw new Error(`ServerStreamMethod ${target.constructor.name}.${name || propertyName} already exists`);
        target.Methods.set(name || propertyName, new models_1.ServerStreamingMethod(target, name || propertyName, method));
    };
}
exports.ServerStreamMethod = ServerStreamMethod;
