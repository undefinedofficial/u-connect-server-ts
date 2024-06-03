/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */

import { encode } from "@msgpack/msgpack";
import { Status, DataType } from "../enums";
import { ResponseMetadata } from "../interfaces/Metadata";

export class Response<P> {
  /**
   *
   */
  constructor(
    public readonly id: number,
    public readonly method: string,
    public type: DataType,
    public response?: P | null,
    public status?: Status | null,
    public meta?: ResponseMetadata | null,
    public error?: string | null
  ) {}

  public static Serialize<T>({
    id,
    method,
    type,
    response,
    status,
    meta,
    error,
  }: Response<T>): Uint8Array {
    return encode([
      id,
      method,
      type,
      response ?? null,
      status ?? null,
      meta ?? null,
      error ?? null,
    ]);
  }
}
