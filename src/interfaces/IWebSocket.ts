/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */

import { WebSocket } from "uWebSockets.js";
import { ServerCallContextSource } from "../models";

export interface UserData {
  islive?: boolean;
  contexts: Map<number, ServerCallContextSource>;
}

export type IWebSocket = WebSocket<UserData>;
