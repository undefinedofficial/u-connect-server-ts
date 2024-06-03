/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */

﻿export const enum TransportOptions {
  /**
   * Write Message and wait confirm from client, keep the order (Slow)
   */
  Confirm = 0,

  /**
   * Write Message without confirm from client, does not guarantee the order (Fast)
   */
  Transfer = 1,
}
