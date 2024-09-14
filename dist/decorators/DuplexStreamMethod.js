/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
import { DuplexStreamingMethod as DuplexStreamingMethodClass, } from "../models";
/**
 * @type {Decorator}
 */
export function DuplexStreamMethod(name) {
    return (target, propertyName, descriptor) => {
        const method = descriptor.value;
        if (!target.Methods)
            target.Methods = new Map();
        else if (target.Methods.has(name || propertyName))
            throw new Error(`DuplexMethod ${target.constructor.name}.${name || propertyName} already exists`);
        target.Methods.set(name || propertyName, new DuplexStreamingMethodClass(target, name || propertyName, method));
    };
}
