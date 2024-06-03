/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */

import { IService } from "../interfaces/IService";

/**
 * @type {Decorator}
 */
export function LogMethod() {
  return (
    target: IService,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<Function>
  ) => {
    const method = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const label = `${target.name}, ${propertyName || "LogTime"}`;
      console.time(label);
      const result = method!.apply(this, args);
      console.timeEnd(label);
      return result;
    };
  };
}
