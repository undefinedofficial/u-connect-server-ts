/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
import { TemplatedApp } from "uWebSockets.js";
import { UConnectHub, UConnectHubOptions } from "./Hub";
export interface UConnectOptions {
    /**
     *  SSL options
     */
    ssl?: {
        key: string;
        cert: string;
        passphrase?: string;
    };
}
export interface UConnectRunOptions {
    /**
     *  Host to listen on. Defaults to 0.0.0.0.
     */
    host?: string;
    /**
     *  Port to listen on. Defaults to 3000.
     */
    port?: number;
}
export declare class UConnectServer {
    private isRunning;
    readonly isSSL: boolean;
    readonly app: TemplatedApp;
    constructor({ ssl }?: UConnectOptions);
    CreateHub({ path, sendPingsAutomatically, compression, idleTimeout, maxBackpressure, maxLifetime, maxPayloadLength, onUpgrade, onClose, }: UConnectHubOptions): UConnectHub;
    Run({ host, port }?: UConnectRunOptions): void;
}
//# sourceMappingURL=Server.d.ts.map