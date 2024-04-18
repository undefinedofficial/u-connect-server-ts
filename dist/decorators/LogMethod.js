"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogMethod = void 0;
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
exports.LogMethod = LogMethod;
