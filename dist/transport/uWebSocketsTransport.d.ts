import { WebSocketBehavior, HttpResponse, HttpRequest, TemplatedApp } from 'uWebSockets.js';
import { I as ITransport, D as Dispatcher } from '../types-D7VpCQBC.js';

interface uWebSocketsTransportOptions<T extends Record<string, any>> extends Omit<WebSocketBehavior<T>, "upgrade" | "message"> {
    upgrade?: (res: HttpResponse, req: HttpRequest) => T | false | Promise<T | false>;
}
declare class uWebSocketsTransport<T extends Record<string, any>> implements ITransport {
    private readonly _path;
    private readonly options;
    private readonly app;
    private dispatcher?;
    constructor(_path: string, options?: uWebSocketsTransportOptions<T>, app?: TemplatedApp);
    bindDispatcher(dispatcher: Dispatcher): void;
    listen(port: number): Promise<void>;
}

export { uWebSocketsTransport };
export type { uWebSocketsTransportOptions };
