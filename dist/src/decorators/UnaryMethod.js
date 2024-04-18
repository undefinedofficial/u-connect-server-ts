"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnaryMethod = void 0;
const models_1 = require("../models");
/**
 * @type {Decorator}
 */
function UnaryMethod(name) {
    return (target, propertyName, descriptor) => {
        const method = descriptor.value;
        if (!target.Methods)
            target.Methods = new Map();
        else if (target.Methods.has(name || propertyName))
            throw new Error(`UnaryMethod ${target.constructor.name}.${name || propertyName} already exists`);
        target.Methods.set(name || propertyName, new models_1.UnaryMethod(target, name || propertyName, method));
    };
}
exports.UnaryMethod = UnaryMethod;
