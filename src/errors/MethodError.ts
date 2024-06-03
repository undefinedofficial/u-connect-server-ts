/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */

import { Status } from "../enums";

export class MethodError extends Error {
  constructor(public readonly status: Status, message: string) {
    super(message);
    this.name = "MethodError";
  }
}
