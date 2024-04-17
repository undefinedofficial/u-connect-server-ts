import { RecognizedString, WebSocket } from "uWebSockets.js";
import { ServerCallContextSource } from "../models";

export interface UserData {
  islive?: boolean;
  contexts: Map<number, ServerCallContextSource>;
}

export type IWebSocket = WebSocket<UserData>;
