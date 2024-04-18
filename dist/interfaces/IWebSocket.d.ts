import { WebSocket } from "uWebSockets.js";
import { ServerCallContextSource } from "../models";
export interface UserData {
    islive?: boolean;
    contexts: Map<number, ServerCallContextSource>;
}
export declare type IWebSocket = WebSocket<UserData>;
//# sourceMappingURL=IWebSocket.d.ts.map