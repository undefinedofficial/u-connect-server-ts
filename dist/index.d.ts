import { HttpRequest, HttpResponse } from "uWebSockets.js";
import { IWebSocket } from "./interfaces";
export * from "./decorators";
export { ServerCallContext } from "./models";
export { IClientStreamReader, IServerStreamWriter } from "./interfaces";
export interface IServiceConstructor {
    new (...args: any[]): any;
}
interface UConnectOptions {
    /**
     *  Path to listen on. Defaults to /api/u-connect.
     */
    path?: string;
    /**
     *  Host to listen on. Defaults to 0.0.0.0.
     */
    host?: string;
    /**
     *  Port to listen on. Defaults to 3000.
     */
    port?: number;
    /**
     *  Maximum length of received message. If a client tries to send you a message larger than this, the connection is immediately closed. Defaults to 16 * 1024.
     */
    maxPayloadLength?: number;
    /**
     *  Maximum number of minutes a WebSocket may be connected before being closed by the server. 0 disables the feature.
     */
    maxLifetime?: number;
    /**
     *  Maximum amount of seconds that may pass without sending or getting a message. Connection is closed if this timeout passes. Resolution (granularity) for timeouts are typically 4 seconds, rounded to closest.
     * Disable by using 0. Defaults to 120.
     */
    idleTimeout?: number;
    /**
     *  Maximum length of allowed backpressure per socket when publishing or sending messages. Slow receivers with too high backpressure will be skipped until they catch up or timeout. Defaults to 64 * 1024.
     */
    maxBackpressure?: number;
    /**
     *  Whether or not we should automatically send pings to uphold a stable connection given whatever idleTimeout.
     */
    sendPingsAutomatically?: boolean;
    /**
     *  What permessage-deflate compression to use.
     */
    compression?: boolean;
    /**
     *  Upgrade handler used to intercept HTTP upgrade requests and potentially upgrade to WebSocket.
     */
    onUpgrade?: <UD extends Record<string, any>>(res: HttpResponse, req: HttpRequest) => false | UD;
    /**
     *  Close handler used to intercept WebSocket close events.
     */
    onClose?: (ws: IWebSocket, code: number, message: string) => void;
}
export declare function createUConnect({ host, port, path, sendPingsAutomatically, compression, idleTimeout, maxBackpressure, maxLifetime, maxPayloadLength, onUpgrade, onClose, }?: UConnectOptions): {
    Run: () => void;
    AddService: <TService extends IServiceConstructor>(service: TService, name?: string) => void;
    RemoveService: (name: string) => void;
};
//# sourceMappingURL=index.d.ts.map