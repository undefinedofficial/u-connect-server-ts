import { IWebSocket } from "../interfaces";
import { Request } from "./Request";
import { ServerCallContextSource } from "./ServerCallContext";

export class ServerCallContextManager {
  private _contexts: Map<number, ServerCallContextSource>;
  private _ws: IWebSocket;
  constructor() {
    this._contexts = new Map();
  }

  SetWebSocket(ws: IWebSocket) {
    this._ws = ws;
  }

  Has(id: number) {
    return this._contexts.has(id);
  }

  Get(id: number) {
    return this._contexts.get(id);
  }

  Create<P>(request: Request<P>) {
    const context = new ServerCallContextSource(this._ws, request);
    this._contexts.set(request.id, context);
    return context;
  }

  /**
   * Abort request and remove context from list.
   */
  async Abort(id: number) {
    const context = this._contexts.get(id);
    if (context) {
      await context.Cancel();
      this._contexts.delete(id);
    }
  }

  /**
   * Remove context from list.
   */
  Delete(id: number) {
    return this._contexts.delete(id);
  }

  /**
   * Abort all requests and Remove all contexts from list.
   */
  async Close() {
    for (const context of this._contexts.values()) await context.Cancel();

    this._contexts.clear();
  }
}
