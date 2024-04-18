"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientStreamMethod = void 0;
const models_1 = require("../models");
/**
 * @type {Decorator}
 */
function ClientStreamMethod(name) {
    return (target, propertyName, descriptor) => {
        const method = descriptor.value;
        if (!target.Methods)
            target.Methods = new Map();
        else if (target.Methods.has(name || propertyName))
            throw new Error(`ClientStreamMethod ${target.constructor.name}.${name || propertyName} already exists`);
        target.Methods.set(name || propertyName, new models_1.ClientStreamingMethod(target, name || propertyName, method));
    };
}
exports.ClientStreamMethod = ClientStreamMethod;
