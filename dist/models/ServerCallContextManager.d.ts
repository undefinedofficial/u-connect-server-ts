import { IWebSocket } from "../interfaces";
import { Request } from "./Request";
import { ServerCallContextSource } from "./ServerCallContext";
export declare class ServerCallContextManager {
    private _contexts;
    private _ws;
    constructor();
    SetWebSocket(ws: IWebSocket): void;
    Has(id: string): boolean;
    Get(id: string): ServerCallContextSource | undefined;
    Create<P>(request: Request<P>): ServerCallContextSource;
    /**
     * Abort request and remove context from list.
     */
    Abort(id: string): Promise<void>;
    /**
     * Remove context from list.
     */
    Delete(id: string): boolean;
    /**
     * Abort all requests and Remove all contexts from list.
     */
    Close(): Promise<void>;
}
//# sourceMappingURL=ServerCallContextManager.d.ts.map