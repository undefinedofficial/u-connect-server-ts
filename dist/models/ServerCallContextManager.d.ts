import { IWebSocket } from "../interfaces";
import { Request } from "./Request";
import { ServerCallContextSource } from "./ServerCallContext";
export declare class ServerCallContextManager {
    private _contexts;
    private _ws;
    constructor();
    SetWebSocket(ws: IWebSocket): void;
    Has(id: number): boolean;
    Get(id: number): ServerCallContextSource | undefined;
    Create<P>(request: Request<P>): ServerCallContextSource;
    /**
     * Abort request and remove context from list.
     */
    Abort(id: number): Promise<void>;
    /**
     * Remove context from list.
     */
    Delete(id: number): boolean;
    /**
     * Abort all requests and Remove all contexts from list.
     */
    Close(): Promise<void>;
}
//# sourceMappingURL=ServerCallContextManager.d.ts.map