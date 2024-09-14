/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
import { UnaryMethod as UnaryMethodClass } from "../models";
/**
 * @type {Decorator}
 */
export function UnaryMethod(name) {
    return (target, propertyName, descriptor) => {
        const method = descriptor.value;
        if (!target.Methods)
            target.Methods = new Map();
        else if (target.Methods.has(name || propertyName))
            throw new Error(`UnaryMethod ${target.constructor.name}.${name || propertyName} already exists`);
        target.Methods.set(name || propertyName, new UnaryMethodClass(target, name || propertyName, method));
    };
}
